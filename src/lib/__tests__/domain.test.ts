import { getEmailDomain, isAllowedEmail } from '../domain';

describe('isAllowedEmail', () => {
  it.each([
    'example@hbplus.fit',
    'Example@HBPlus.fit',
    '  coach@hbplus.fit  ',
    'first.last+tag@hbplus.fit',
  ])('lets %p in', (email) => {
    expect(isAllowedEmail(email, 'hbplus.fit')).toBe(true);
  });

  it.each([
    ['personal gmail', 'example@gmail.com'],
    ['lookalike domain', 'someone@nothbplus.fit'],
    ['subdomain', 'someone@mail.hbplus.fit'],
    ['domain as a prefix', 'someone@hbplus.fit.evil.com'],
    ['domain in the local part', 'hbplus.fit@gmail.com'],
    ['quoted @ trick', '"x@hbplus.fit"@gmail.com'],
    ['no local part', '@hbplus.fit'],
    ['empty', ''],
    ['null', null],
    ['undefined', undefined],
  ])('blocks %s', (_label, email) => {
    expect(isAllowedEmail(email, 'hbplus.fit')).toBe(false);
  });

  it('normalises the configured domain', () => {
    expect(isAllowedEmail('a@hbplus.fit', ' @HBPLUS.FIT ')).toBe(true);
  });
});

describe('getEmailDomain', () => {
  it('uses the part after the last @', () => {
    expect(getEmailDomain('"a@b"@Example.com')).toBe('example.com');
  });

  it('returns null for malformed input', () => {
    expect(getEmailDomain('not-an-email')).toBeNull();
    expect(getEmailDomain('trailing@')).toBeNull();
  });
});
