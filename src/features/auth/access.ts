import { ALLOWED_DOMAIN } from '@/lib/domain';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export const MISSING_PROFILE_MESSAGE =
  "Your Google account checks out, but there's no team profile for it yet. Please contact an HB+ admin.";

export const SUSPENDED_MESSAGE =
  "Your access to the HB+ team space is paused. If you think that's a mistake, please contact your HB+ admin.";

// The database list is the source of truth, since admins can add domains
// from the admin panel. If it can't be read (for example before the
// admin-panel migration has run), fall back to the domain the app was built
// with. The server enforces the real rule either way.
export async function loadAllowedDomains(): Promise<string[]> {
  const { data, error } = await supabase.rpc('allowed_domain_list');
  if (error || !data?.length) return [ALLOWED_DOMAIN];
  return data;
}

export function loadProfile(userId: string) {
  return supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
}

// Why an otherwise valid Google account still can't come in, if anything.
export function accessProblem(profile: Profile | null): string | null {
  if (!profile) return MISSING_PROFILE_MESSAGE;
  if (profile.status === 'suspended') return SUSPENDED_MESSAGE;
  return null;
}
