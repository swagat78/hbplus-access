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
  key: string;
  rows: DailySignIns[] | null;
  failed: boolean;
};

type Options = {
  // Admins see the whole team by default; this narrows them to their own
  // sign-ins. Members only ever get their own, whatever is passed.
  onlyMine?: boolean;
};

// The scoping happens in the database function itself, not here.
export function useSignInStats(days: number, { onlyMine = false }: Options = {}) {
  const key = `${days}:${onlyMine}`;
  const [state, setState] = useState<State>({ key, rows: null, failed: false });

  useEffect(() => {
    let cancelled = false;

    // only_mine is sent only when it's on, so the team chart keeps working
    // on a database that hasn't had the insights migration yet.
    supabase
      .rpc('sign_ins_by_day', { days, tz: timeZone(), ...(onlyMine ? { only_mine: true } : {}) })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          if (__DEV__) console.warn('[sign_ins_by_day]', error.code, error.message);
          setState((prev) => ({ key, rows: prev.rows, failed: true }));
          return;
        }
        setState({
          key,
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
  }, [days, onlyMine, key]);

  return {
    rows: state.rows,
    failed: state.failed && state.rows === null,
    // A new range is loading: keep showing the old one, dimmed.
    stale: state.key !== key,
  };
}
