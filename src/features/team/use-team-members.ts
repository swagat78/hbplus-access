import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { AppRole, Profile } from '@/types/database';

// RLS decides what comes back: admins get every profile, anyone else would
// only ever see their own row.
function fetchMembers() {
  return supabase.from('profiles').select('*').order('created_at', { ascending: true });
}

export function useTeamMembers() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchMembers().then(({ data, error: queryError }) => {
      if (cancelled) return;
      if (queryError) {
        setError("Couldn't load the team. Please try again in a moment.");
      } else {
        setMembers(data);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const changeRole = useCallback(async (memberId: string, role: AppRole) => {
    const { error: rpcError } = await supabase.rpc('set_member_role', {
      member_id: memberId,
      new_role: role,
    });
    if (rpcError) throw new Error(rpcError.message);

    setMembers((current) => current.map((m) => (m.id === memberId ? { ...m, role } : m)));
  }, []);

  return { members, loading, error, changeRole };
}
