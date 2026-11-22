import type { SupportedStorage } from '@supabase/supabase-js';

// On web supabase-js falls back to localStorage. There's no Keychain
// equivalent in the browser; the trade-off is written up in the README.
export const authStorage: SupportedStorage | undefined = undefined;
