import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { TeamOverview } from '@/types/database';

export function useTeamOverview() {
  const [overview, setOverview] = useState<TeamOverview | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    supabase.rpc('team_overview').then(({ data, error }) => {
      if (cancelled) return;
      // A failure only leaves the tiles showing "—"; it isn't worth an
      // error banner on the home screen. It is worth a line in the console,
      // or a missing migration goes unnoticed.
      if (error || !data) {
        if (__DEV__ && error) console.warn('[team_overview]', error.code, error.message);
        setFailed(true);
      } else setOverview(data);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { overview, failed };
}
