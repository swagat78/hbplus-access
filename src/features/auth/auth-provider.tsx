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
import { Platform } from 'react-native';

import { DOMAIN_RESTRICTED_MESSAGE, isAllowedEmail } from '@/lib/domain';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

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

const MISSING_PROFILE_MESSAGE =
  "Your Google account checks out, but there's no team profile for it yet. Please contact an HB+ admin.";

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

        if (!isAllowedEmail(data.user?.email)) {
          await reject(DOMAIN_RESTRICTED_MESSAGE);
          return;
        }

        // RLS only returns this row for an allowed domain, so this is a
        // server-side check as well as the source of the user's role.
        const { data: row, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        if (id !== checkId.current) return;

        if (!row) {
          await reject(MISSING_PROFILE_MESSAGE);
          return;
        }

        admittedUserId.current = data.user.id;
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

  useEffect(() => {
    if (!env.isConfigured) return;

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!next) {
        checkId.current++;
        admittedUserId.current = null;
        setSession(null);
        setProfile(null);
        setStatus('signed-out');
        return;
      }

      if (next.user.id === admittedUserId.current) {
        setSession(next);
        return;
      }

      // supabase-js holds a lock while this callback runs, and getUser()
      // inside it would wait on that lock forever. Run the checks after.
      setTimeout(() => void admit(next), 0);
    });

    return () => data.subscription.unsubscribe();
  }, [admit]);

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
      isAdmin: status === 'signed-in' && profile?.role === 'admin',
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
