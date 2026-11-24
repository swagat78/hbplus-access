import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { AuthEvent, AuthEventKind, Profile } from '@/types/database';

type Person = Pick<Profile, 'full_name' | 'email' | 'avatar_url'>;

export type ActivityItem = AuthEvent & {
  member: Person | null;
  actor: Person | null;
};

// RLS scopes this for us: admins get the whole team's log, members only
// their own rows. A member also can't read the admin who changed their
// role, so `actor` comes back null for them.
const SELECT = `
  id, user_id, actor_id, kind, detail, created_at,
  member:profiles!auth_events_user_id_fkey ( full_name, email, avatar_url ),
  actor:profiles!auth_events_actor_id_fkey ( full_name, email, avatar_url )
`;

type State = {
  key: string;
  items: ActivityItem[] | null;
  failed: boolean;
};

export function useActivity(limit: number, kinds?: readonly AuthEventKind[]) {
  const kindsKey = kinds?.join(',') ?? '';
  const key = `${kindsKey}|${limit}`;
  const [state, setState] = useState<State>({ key, items: null, failed: false });

  useEffect(() => {
    let cancelled = false;
    const requestKey = `${kindsKey}|${limit}`;

    let query = supabase
      .from('auth_events')
      .select(SELECT)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (kindsKey) query = query.in('kind', kindsKey.split(',') as AuthEventKind[]);

    query.then(({ data, error }) => {
      if (cancelled) return;
      setState((prev) =>
        error
          ? { key: requestKey, items: prev.items, failed: true }
          : { key: requestKey, items: (data ?? []) as unknown as ActivityItem[], failed: false },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [kindsKey, limit]);

  return {
    items: state.items ?? [],
    loading: state.items === null && !state.failed,
    failed: state.failed && state.items === null,
    // Filter or page changed: keep the previous list up, dimmed, until the
    // new one lands. No spinner flash, no layout jump.
    stale: state.key !== key,
  };
}
