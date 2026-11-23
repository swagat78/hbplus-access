import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { TeamOverview } from '@/types/database';

export function useTeamOverview() {
  const [overview, setOverview] = useState<TeamOverview | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.rpc('team_overview').then(({ data, error }) => {
      // A failure here just leaves the tiles showing "—"; it isn't worth
      // an error banner on the home screen.
      if (!cancelled && !error && data) setOverview(data);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return overview;
}
