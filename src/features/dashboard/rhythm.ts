import type { DailySignIns } from '@/types/database';

export type RhythmDay = {
  key: string;
  count: number;
  isToday: boolean;
  // Later this week: drawn as an empty slot, not as a day with no sign-ins.
  isFuture: boolean;
};

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Local calendar date as YYYY-MM-DD, the same shape the database buckets use.
export function dayKey(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

// Built from the calendar parts rather than adding milliseconds, so a
// daylight-saving change can't skip or repeat a day.
function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function oldestFirst(rows: DailySignIns[]) {
  return [...rows].sort((a, b) => a.bucket.localeCompare(b.bucket));
}

// How many days up to and including today a calendar of `weeks` columns
// shows: the full earlier weeks plus this week so far. 78 on a Monday,
// 84 on a Sunday, for 12 weeks.
export function shownDays(today: Date, weeks: number) {
  return (weeks - 1) * 7 + ((today.getDay() + 6) % 7) + 1;
}

// Monday-first weeks, oldest column first. The last column is this week.
export function buildWeeks(rows: DailySignIns[], today: Date, weeks: number): RhythmDay[][] {
  const counts = new Map(rows.map((r) => [r.bucket, r.sign_ins]));
  const todayKey = dayKey(today);
  const thisMonday = addDays(today, -((today.getDay() + 6) % 7));
  const start = addDays(thisMonday, -(weeks - 1) * 7);

  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const key = dayKey(addDays(start, w * 7 + d));
      return {
        key,
        count: counts.get(key) ?? 0,
        isToday: key === todayKey,
        isFuture: key > todayKey,
      };
    }),
  );
}

// Rows are one per day, ending today. A run that reached yesterday still
// counts as current until today ends without a sign-in.
export function streaks(rows: DailySignIns[]) {
  const days = oldestFirst(rows);
  let best = 0;
  let run = 0;
  for (const day of days) {
    run = day.sign_ins > 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }

  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].sign_ins > 0) current++;
    else if (i === days.length - 1) continue;
    else break;
  }

  return { current, best };
}

// The most recent `days` rows, oldest first.
export function lastDays(rows: DailySignIns[], days: number) {
  return oldestFirst(rows).slice(-days);
}

export function totalOfLast(rows: DailySignIns[], days: number) {
  return lastDays(rows, days).reduce((sum, r) => sum + r.sign_ins, 0);
}

// The weekday with the most sign-ins, or null when there's too little to
// call it (fewer than three, or a tie at the top).
export function busiestWeekday(cells: RhythmDay[][]) {
  const totals = Array<number>(7).fill(0);
  for (const week of cells) week.forEach((day, d) => (totals[d] += day.count));

  const sum = totals.reduce((a, b) => a + b, 0);
  const top = Math.max(...totals);
  if (sum < 3 || totals.filter((t) => t === top).length > 1) return null;
  return WEEKDAYS[totals.indexOf(top)];
}

// 0 = none, then 1, 2, 3, and 4+ sign-ins on a day.
export function level(count: number) {
  return Math.min(4, Math.max(0, count));
}
