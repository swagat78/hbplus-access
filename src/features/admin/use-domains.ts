import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { DomainRow } from '@/types/database';

export function useDomains() {
  const [domains, setDomains] = useState<DomainRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    supabase.rpc('admin_domains').then(({ data, error: rpcError }) => {
      if (cancelled) return;
      if (rpcError) {
        setError("Couldn't load the domain list. Has the admin-panel migration been run?");
        return;
      }
      setError(null);
      setDomains(
        (data ?? []).map((row) => ({
          domain: row.domain,
          created_at: row.created_at,
          members: Number(row.members),
        })),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [version]);

  // The database validates and logs both of these; the messages it raises
  // are written for people, so they're shown as-is.
  const add = useCallback(async (domain: string) => {
    const { error: rpcError } = await supabase.rpc('add_allowed_domain', { new_domain: domain });
    if (rpcError) throw new Error(rpcError.message);
    setVersion((v) => v + 1);
  }, []);

  const remove = useCallback(async (domain: string) => {
    const { error: rpcError } = await supabase.rpc('remove_allowed_domain', { old_domain: domain });
    if (rpcError) throw new Error(rpcError.message);
    setVersion((v) => v + 1);
  }, []);

  return { domains, error, add, remove };
}
