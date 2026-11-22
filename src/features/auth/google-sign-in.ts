import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';
import { readUrlParams } from '@/lib/url-params';

import { hasOAuthError, OAuthRedirectError } from './errors';

export type SignInOutcome = 'completed' | 'cancelled' | 'redirected';

// Native flow: open Google in an auth session (ASWebAuthenticationSession /
// Custom Tabs), wait for the deep link back, then swap the PKCE code for a
// session. The code verifier never leaves the device.
//
// Redirecting to /login rather than a dedicated callback path means the
// router always has a real screen to land on if it sees the deep link too.
export async function signInWithGoogle(): Promise<SignInOutcome> {
  const redirectTo = Linking.createURL('login');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return 'cancelled';

  const params = readUrlParams(result.url);
  if (hasOAuthError(params)) throw new OAuthRedirectError(params);
  if (!params.code) throw new Error('Google sign-in returned without an authorization code.');

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
  if (exchangeError) throw exchangeError;

  return 'completed';
}

// Only the web build gets errors back through the page URL.
export function takeRedirectError(): OAuthRedirectError | null {
  return null;
}
