import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { AuthEvent, Profile } from '@/types/database';

type Person = Pick<Profile, 'full_name' | 'email' | 'avatar_url'>;

export type ActivityItem = Omit<AuthEvent, 'actor_id'> & {
  member: Person | null;
  actor: Pick<Profile, 'full_name' | 'email'> | null;
};

// RLS scopes this for us: admins get the whole team's log, members only
// their own rows. A member also can't read the admin who changed their
// role, so `actor` comes back null for them.
const SELECT = `
  id, user_id, kind, detail, created_at,
  member:profiles!auth_events_user_id_fkey ( full_name, email, avatar_url ),
  actor:profiles!auth_events_actor_id_fkey ( full_name, email )
`;

export function useActivity(limit: number) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('auth_events')
      .select(SELECT)
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data, error: queryError }) => {
        if (cancelled) return;
        if (queryError) {
          setError("Couldn't load activity right now.");
        } else {
          setItems((data ?? []) as unknown as ActivityItem[]);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { items, loading, error };
}
