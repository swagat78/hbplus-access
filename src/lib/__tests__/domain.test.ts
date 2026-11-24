import { getEmailDomain, isAllowedEmail, isValidDomain } from '../domain';

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

  it('accepts any domain from a list (what the database returns)', () => {
    const list = ['hbplus.fit', 'hop.studio'];
    expect(isAllowedEmail('coach@hop.studio', list)).toBe(true);
    expect(isAllowedEmail('coach@hbplus.fit', list)).toBe(true);
    expect(isAllowedEmail('coach@gmail.com', list)).toBe(false);
    expect(isAllowedEmail('coach@studio', list)).toBe(false);
  });

  it('lets nobody in with an empty list', () => {
    expect(isAllowedEmail('coach@hbplus.fit', [])).toBe(false);
  });
});

describe('isValidDomain', () => {
  it.each(['hbplus.fit', '@hbplus.fit', 'mail.hop-studio.co.uk', ' HBPLUS.FIT '])('accepts %p', (value) => {
    expect(isValidDomain(value)).toBe(true);
  });

  it.each(['localhost', 'hbplus', '-bad.com', 'bad-.com', 'a b.com', 'x@y.com', '', 'hbplus.fit.'])(
    'rejects %p',
    (value) => {
      expect(isValidDomain(value)).toBe(false);
    },
  );
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
