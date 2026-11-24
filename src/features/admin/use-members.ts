import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { AppRole, MemberStatus, Profile } from '@/types/database';

// RLS decides what comes back: admins get every profile. The writes go
// through functions that re-check the caller is an admin, so this hook
// can't be used to grant anything on its own.
export function useMembers() {
  const [members, setMembers] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error: queryError }) => {
        if (cancelled) return;
        if (queryError) setError("Couldn't load members. Please try again in a moment.");
        else setMembers(data);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const patch = (id: string, change: Partial<Profile>) =>
    setMembers((current) => current?.map((m) => (m.id === id ? { ...m, ...change } : m)) ?? current);

  const changeRole = useCallback(async (memberId: string, role: AppRole) => {
    const { error: rpcError } = await supabase.rpc('set_member_role', { member_id: memberId, new_role: role });
    if (rpcError) throw new Error(rpcError.message);
    patch(memberId, { role });
  }, []);

  const changeStatus = useCallback(async (memberId: string, status: MemberStatus) => {
    const { error: rpcError } = await supabase.rpc('set_member_status', {
      member_id: memberId,
      new_status: status,
    });
    if (rpcError) throw new Error(rpcError.message);
    patch(memberId, { status });
  }, []);

  return { members, error, changeRole, changeStatus };
}
