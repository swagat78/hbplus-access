const DEFAULT_DOMAIN = 'hbplus.fit';

export const ALLOWED_DOMAIN = normalizeDomain(
  process.env.EXPO_PUBLIC_ALLOWED_DOMAIN || DEFAULT_DOMAIN,
);

export const DOMAIN_RESTRICTED_MESSAGE =
  'Access restricted. Please login using your official domain email.';

function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^@/, '');
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
  domain: string = ALLOWED_DOMAIN,
) {
  return getEmailDomain(email) === normalizeDomain(domain);
}
