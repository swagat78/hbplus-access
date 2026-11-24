const DEFAULT_DOMAIN = 'hbplus.fit';

// The domain the sign-in screen talks about. After sign-in the app checks
// against the list in the database instead (admins can extend it), and falls
// back to this one if that list can't be loaded.
export const ALLOWED_DOMAIN = normalizeDomain(
  process.env.EXPO_PUBLIC_ALLOWED_DOMAIN || DEFAULT_DOMAIN,
);

export const DOMAIN_RESTRICTED_MESSAGE =
  'Access restricted. Please login using your official domain email.';

const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^@/, '');
}

// Same rule the database applies in add_allowed_domain(); checked here too
// only so the admin form can say what's wrong before the round trip.
export function isValidDomain(value: string) {
  return DOMAIN_PATTERN.test(normalizeDomain(value));
}

export function getEmailDomain(email: string | null | undefined): string | null {
  if (!email) return null;

  const value = email.trim().toLowerCase();
  const at = value.lastIndexOf('@');
  if (at <= 0 || at === value.length - 1) return null;

  return value.slice(at + 1);
}

// Exact match on purpose. A plain endsWith('hbplus.fit') would also accept
// "someone@nothbplus.fit" or a subdomain we never agreed to trust.
export function isAllowedEmail(
  email: string | null | undefined,
  domains: string | readonly string[] = ALLOWED_DOMAIN,
) {
  const domain = getEmailDomain(email);
  if (!domain) return false;

  const allowed = (typeof domains === 'string' ? [domains] : domains).map(normalizeDomain);
  return allowed.includes(domain);
}
