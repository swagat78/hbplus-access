import 'react-native-url-polyfill/auto';

import { createClient, processLock } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/types/database';

import { authStorage } from './auth-storage';
import { env } from './env';

const isWeb = Platform.OS === 'web';

// createClient throws on an empty URL. When the env isn't set we still build
// a client so the app boots, and the login screen explains what's missing.
export const supabase = createClient<Database>(
  env.supabaseUrl || 'https://not-configured.supabase.co',
  env.supabaseKey || 'not-configured',
  {
    auth: {
      storage: authStorage,
      persistSession: true,
      autoRefreshToken: true,
      flowType: 'pkce',
      // Web gets the OAuth code back in the page URL. On native we exchange
      // it ourselves after the auth browser closes.
      detectSessionInUrl: isWeb,
      ...(isWeb ? {} : { lock: processLock }),
    },
  },
);

// Timers don't run reliably while a native app is in the background, so the
// refresh loop is paused and resumed with the app instead.
if (!isWeb) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
