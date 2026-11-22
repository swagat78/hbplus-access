import { readUrlParams } from '../url-params';

describe('readUrlParams', () => {
  it('reads the PKCE code from the query string', () => {
    expect(readUrlParams('hbplusaccess://login?code=abc-123')).toEqual({ code: 'abc-123' });
  });

  it('reads errors from the hash fragment', () => {
    const url =
      'https://team.example/login#error=access_denied&error_description=Access+restricted.+Please+login+using+your+official+domain+email.';
    expect(readUrlParams(url)).toEqual({
      error: 'access_denied',
      error_description: 'Access restricted. Please login using your official domain email.',
    });
  });

  it('merges query and hash', () => {
    expect(readUrlParams('exp://127.0.0.1:8081/--/login?a=1#b=2')).toEqual({ a: '1', b: '2' });
  });

  it('survives malformed encoding', () => {
    expect(readUrlParams('x://y?bad=%E0%A4%A')).toEqual({ bad: '%E0%A4%A' });
  });

  it('returns an empty object when there are no params', () => {
    expect(readUrlParams('https://team.example/login')).toEqual({});
  });
});
