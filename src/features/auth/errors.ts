import { DOMAIN_RESTRICTED_MESSAGE } from '@/lib/domain';

export class DomainRestrictedError extends Error {
  constructor() {
    super(DOMAIN_RESTRICTED_MESSAGE);
    this.name = 'DomainRestrictedError';
  }
}

export class OAuthRedirectError extends Error {
  code: string | undefined;

  constructor(params: Record<string, string>) {
    super(params.error_description || params.error || 'OAuth redirect failed');
    this.name = 'OAuthRedirectError';
    this.code = params.error_code || params.error;
  }
}

export function hasOAuthError(params: Record<string, string>) {
  return Boolean(params.error || params.error_code || params.error_description);
}

// Both server-side guards end up here when they reject a Google account:
// the before-user-created hook returns our message as-is, and the
// auth.users trigger surfaces as Supabase's generic "Database error saving
// new user".
const RESTRICTED_PATTERNS = [/official domain/i, /database error saving new user/i];

const NETWORK_PATTERNS = [/network request failed/i, /failed to fetch/i, /networkerror/i];

export function toAuthMessage(error: unknown): string {
  if (error instanceof DomainRestrictedError) return DOMAIN_RESTRICTED_MESSAGE;

  const message = error instanceof Error ? error.message : String(error ?? '');

  if (RESTRICTED_PATTERNS.some((p) => p.test(message))) {
    return DOMAIN_RESTRICTED_MESSAGE;
  }
  if (NETWORK_PATTERNS.some((p) => p.test(message))) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  if (/access_denied|cancel/i.test(message)) {
    return 'Google sign-in was cancelled.';
  }
  return 'Something went wrong while signing you in. Please try again.';
}
