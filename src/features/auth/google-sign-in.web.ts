import { supabase } from '@/lib/supabase';
import { readUrlParams } from '@/lib/url-params';

import { hasOAuthError, OAuthRedirectError } from './errors';

export type SignInOutcome = 'completed' | 'cancelled' | 'redirected';

// Web flow: a full-page redirect to Google and back to /login. supabase-js
// (detectSessionInUrl) picks up the ?code= on return and finishes PKCE.
// A redirect is used instead of a popup so blockers and Safari's ITP have
// nothing to interfere with.
export async function signInWithGoogle(): Promise<SignInOutcome> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/login`,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;
  return 'redirected';
}

// When Supabase rejects the account (domain hook / trigger) it sends the
// browser back with ?error=...&error_description=... instead of a code.
// Read it once and strip it so a refresh doesn't show the error again.
export function takeRedirectError(): OAuthRedirectError | null {
  const params = readUrlParams(window.location.href);
  if (!hasOAuthError(params)) return null;

  window.history.replaceState(window.history.state, '', window.location.pathname);
  return new OAuthRedirectError(params);
}
