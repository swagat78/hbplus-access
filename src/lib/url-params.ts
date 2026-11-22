// Reads both the query string and the hash fragment. Supabase puts the PKCE
// `code` in the query, but OAuth errors can come back in either place.
//
// Written by hand because URLSearchParams is only partially implemented in
// some React Native runtimes.
export function readUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};

  const [beforeHash, hash = ''] = url.split('#');
  const query = beforeHash.includes('?') ? beforeHash.slice(beforeHash.indexOf('?') + 1) : '';

  for (const chunk of [query, hash]) {
    if (!chunk) continue;
    for (const pair of chunk.split('&')) {
      const eq = pair.indexOf('=');
      const key = decode(eq === -1 ? pair : pair.slice(0, eq));
      if (!key) continue;
      params[key] = eq === -1 ? '' : decode(pair.slice(eq + 1));
    }
  }

  return params;
}

function decode(value: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}
