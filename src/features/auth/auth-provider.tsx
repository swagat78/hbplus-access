import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Platform } from 'react-native';

import { DOMAIN_RESTRICTED_MESSAGE, isAllowedEmail } from '@/lib/domain';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

import { accessProblem, loadAllowedDomains, loadProfile } from './access';
import { toAuthMessage } from './errors';
import { signInWithGoogle, takeRedirectError, type SignInOutcome } from './google-sign-in';

// loading    - restoring a stored session on boot
// verifying  - Google is done, we're checking the account before letting it in
type AuthStatus = 'loading' | 'signed-out' | 'verifying' | 'signed-in';

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isSigningIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

// How often coming back to the app re-reads your profile, so a role change
// or a suspension by an admin applies without signing out and in again.
const RECHECK_INTERVAL_MS = 30_000;

const AuthContext = createContext<AuthContextValue | null>(null);

// Read once at startup: on web a rejected sign-in comes back as
// /login?error=... and this is the only chance to show why.
const redirectError = env.isConfigured ? takeRedirectError() : null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(env.isConfigured ? 'loading' : 'signed-out');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(() =>
    redirectError ? toAuthMessage(redirectError) : null,
  );
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Which user has already passed the checks, so token refreshes don't
  // trigger a full re-verification every hour.
  const admittedUserId = useRef<string | null>(null);
  // Bumped on every new check so a slow, stale one can't overwrite a newer result.
  const checkId = useRef(0);
  const lastRecheck = useRef(0);

  const reject = useCallback(async (message: string) => {
    admittedUserId.current = null;
    setError(message);
    // scope 'local' clears this device first and then revokes the refresh
    // token, so it still works when the network is down.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    setSession(null);
    setProfile(null);
    setStatus('signed-out');
  }, []);

  const admit = useCallback(
    async (next: Session) => {
      const id = ++checkId.current;
      setStatus((current) => (current === 'loading' ? current : 'verifying'));

      try {
        // getSession() only reads local storage. getUser() asks the auth
        // server, so the email we check comes from a token it still accepts.
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (id !== checkId.current) return;

        // Independent reads, so they go out together. RLS only returns the
        // profile row for an allowed domain, which makes it a server-side
        // check as well as the source of the role.
        const [domains, { data: row, error: profileError }] = await Promise.all([
          loadAllowedDomains(),
          loadProfile(data.user.id),
        ]);
        if (id !== checkId.current) return;

        if (!isAllowedEmail(data.user.email, domains)) {
          await reject(DOMAIN_RESTRICTED_MESSAGE);
          return;
        }
        if (profileError) throw profileError;

        const problem = accessProblem(row);
        if (problem || !row) {
          await reject(problem ?? DOMAIN_RESTRICTED_MESSAGE);
          return;
        }

        admittedUserId.current = data.user.id;
        lastRecheck.current = Date.now();
        setSession(next);
        setProfile(row);
        setError(null);
        setStatus('signed-in');
      } catch (e) {
        if (id === checkId.current) await reject(toAuthMessage(e));
      }
    },
    [reject],
  );

  // Lighter than admit(): the identity is already proven, this only picks up
  // changes an admin made since (role, suspension, domain removed).
  const recheck = useCallback(async () => {
    const userId = admittedUserId.current;
    if (!userId || Date.now() - lastRecheck.current < RECHECK_INTERVAL_MS) return;
    lastRecheck.current = Date.now();

    const { data: row, error: profileError } = await loadProfile(userId);
    // A failed read is usually the network. The next focus tries again.
    if (profileError || admittedUserId.current !== userId) return;

    // No row any more means RLS hid it, i.e. the domain was taken off the list.
    const problem = row ? accessProblem(row) : DOMAIN_RESTRICTED_MESSAGE;
    if (problem || !row) {
      await reject(problem ?? DOMAIN_RESTRICTED_MESSAGE);
      return;
    }
    setProfile(row);
  }, [reject]);

  useEffect(() => {
    if (!env.isConfigured) return;

    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (!next) {
        checkId.current++;
        admittedUserId.current = null;
        setSession(null);
        setProfile(null);
        setStatus('signed-out');
        return;
      }

      // supabase-js holds a lock while this callback runs, and any Supabase
      // call inside it would wait on that lock forever. Work happens after.
      if (next.user.id === admittedUserId.current) {
        setSession(next);
        if (event === 'TOKEN_REFRESHED') setTimeout(() => void recheck(), 0);
        return;
      }

      setTimeout(() => void admit(next), 0);
    });

    return () => data.subscription.unsubscribe();
  }, [admit, recheck]);

  // Coming back to the tab / app is the natural moment to pick up changes.
  useEffect(() => {
    if (Platform.OS === 'web') {
      const onVisible = () => {
        if (document.visibilityState === 'visible') void recheck();
      };
      document.addEventListener('visibilitychange', onVisible);
      return () => document.removeEventListener('visibilitychange', onVisible);
    }

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void recheck();
    });
    return () => subscription.remove();
  }, [recheck]);

  // Pressing Back on Google's page can restore this page from the bfcache
  // with the button still spinning.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setIsSigningIn(false);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const signIn = useCallback(async () => {
    if (!env.isConfigured) return;

    setError(null);
    setIsSigningIn(true);
    let outcome: SignInOutcome | null = null;
    try {
      outcome = await signInWithGoogle();
    } catch (e) {
      setError(toAuthMessage(e));
    } finally {
      // On web the page is already leaving for Google.
      if (outcome !== 'redirected') setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    await supabase.auth.signOut({ scope: 'local' });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      profile,
      isAdmin: status === 'signed-in' && profile?.role === 'admin' && profile.status !== 'suspended',
      isSigningIn,
      error,
      signIn,
      signOut,
      clearError,
    }),
    [status, session, profile, isSigningIn, error, signIn, signOut, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
