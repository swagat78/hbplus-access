import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { DailySignIns } from '@/types/database';

function timeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

type State = {
  days: number;
  rows: DailySignIns[] | null;
  failed: boolean;
};

// RLS-style scoping happens in the function itself: admins get the whole
// team's numbers, members only their own.
export function useSignInStats(days: number) {
  const [state, setState] = useState<State>({ days, rows: null, failed: false });

  useEffect(() => {
    let cancelled = false;

    supabase.rpc('sign_ins_by_day', { days, tz: timeZone() }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setState((prev) => ({ days, rows: prev.rows, failed: true }));
        return;
      }
      setState({
        days,
        failed: false,
        rows: (data ?? []).map((row) => ({
          bucket: String(row.bucket),
          sign_ins: Number(row.sign_ins),
          people: Number(row.people),
        })),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [days]);

  return {
    rows: state.rows,
    failed: state.failed && state.rows === null,
    // A new range is loading: keep showing the old one, dimmed.
    stale: state.days !== days,
  };
}
