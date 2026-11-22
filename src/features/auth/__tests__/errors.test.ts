import { DOMAIN_RESTRICTED_MESSAGE } from '@/lib/domain';

import { DomainRestrictedError, OAuthRedirectError, toAuthMessage } from '../errors';

describe('toAuthMessage', () => {
  it('shows the domain message for a client-side rejection', () => {
    expect(toAuthMessage(new DomainRestrictedError())).toBe(DOMAIN_RESTRICTED_MESSAGE);
  });

  it('recognises the auth hook rejection coming back on the redirect', () => {
    const error = new OAuthRedirectError({
      error: 'access_denied',
      error_description: DOMAIN_RESTRICTED_MESSAGE,
    });
    expect(toAuthMessage(error)).toBe(DOMAIN_RESTRICTED_MESSAGE);
  });

  it('recognises the trigger rejection (generic Supabase message)', () => {
    const error = new OAuthRedirectError({
      error: 'server_error',
      error_description: 'Database error saving new user',
    });
    expect(toAuthMessage(error)).toBe(DOMAIN_RESTRICTED_MESSAGE);
  });

  it('gives a connection hint for network failures', () => {
    expect(toAuthMessage(new TypeError('Network request failed'))).toMatch(/connection/);
  });

  it('falls back to a generic message without leaking internals', () => {
    expect(toAuthMessage(new Error('relation "profiles" does not exist'))).toBe(
      'Something went wrong while signing you in. Please try again.',
    );
  });
});
