import type { DailySignIns } from '@/types/database';

import {
  buildWeeks,
  busiestWeekday,
  dayKey,
  lastDays,
  level,
  shownDays,
  streaks,
  totalOfLast,
} from '../rhythm';

// One row per day ending on `end`, oldest first, with the given counts.
function series(end: Date, counts: number[]): DailySignIns[] {
  return counts.map((sign_ins, i) => {
    const date = new Date(end.getFullYear(), end.getMonth(), end.getDate() - (counts.length - 1 - i));
    return { bucket: dayKey(date), sign_ins, people: sign_ins ? 1 : 0 };
  });
}

// Wednesday 25 November 2026.
const WEDNESDAY = new Date(2026, 10, 25, 15, 30);

describe('buildWeeks', () => {
  const weeks = buildWeeks(series(WEDNESDAY, [2, 0, 1]), WEDNESDAY, 12);
  const days = weeks.flat();

  it('lays out 12 Monday-first weeks', () => {
    expect(weeks).toHaveLength(12);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(new Date(2026, 8, 7).getDay()).toBe(1);
    expect(days[0].key).toBe('2026-09-07');
  });

  it('marks today and the rest of this week', () => {
    const last = weeks[11];
    expect(last[2]).toMatchObject({ key: '2026-11-25', isToday: true, isFuture: false, count: 1 });
    expect(last.slice(3).every((d) => d.isFuture)).toBe(true);
    expect(days.filter((d) => d.isToday)).toHaveLength(1);
  });

  it('places counts on their day', () => {
    expect(days.find((d) => d.key === '2026-11-23')?.count).toBe(2);
    expect(days.find((d) => d.key === '2026-11-24')?.count).toBe(0);
  });

  it('starts on a Monday when today is a Sunday', () => {
    const sunday = new Date(2026, 10, 29);
    const w = buildWeeks([], sunday, 1);
    expect(w[0][0].key).toBe('2026-11-23');
    expect(w[0][6]).toMatchObject({ key: '2026-11-29', isToday: true });
  });
});

describe('streaks', () => {
  it('counts the run ending today', () => {
    expect(streaks(series(WEDNESDAY, [1, 0, 1, 1, 2]))).toEqual({ current: 3, best: 3 });
  });

  it('keeps a run that reached yesterday alive', () => {
    expect(streaks(series(WEDNESDAY, [1, 1, 1, 0]))).toEqual({ current: 3, best: 3 });
  });

  it('drops a run that ended before yesterday', () => {
    expect(streaks(series(WEDNESDAY, [1, 1, 0, 0]))).toEqual({ current: 0, best: 2 });
  });

  it('keeps the best run separately', () => {
    expect(streaks(series(WEDNESDAY, [1, 1, 1, 1, 0, 1]))).toEqual({ current: 1, best: 4 });
  });

  it('does not depend on the order rows arrive in', () => {
    expect(streaks(series(WEDNESDAY, [0, 1, 1]).reverse())).toEqual({ current: 2, best: 2 });
  });

  it('is zero with no rows', () => {
    expect(streaks([])).toEqual({ current: 0, best: 0 });
  });
});

describe('totalOfLast', () => {
  it('sums only the most recent days', () => {
    expect(totalOfLast(series(WEDNESDAY, [5, 1, 2, 3]), 3)).toBe(6);
  });

  it('picks the most recent days whatever order rows arrive in', () => {
    expect(totalOfLast(series(WEDNESDAY, [5, 1, 2, 3]).reverse(), 2)).toBe(5);
  });
});

describe('shownDays', () => {
  it('matches the cells the calendar draws up to today', () => {
    for (const date of [new Date(2026, 10, 23), WEDNESDAY, new Date(2026, 10, 29)]) {
      const drawn = buildWeeks([], date, 12).flat().filter((d) => !d.isFuture).length;
      expect(shownDays(date, 12)).toBe(drawn);
    }
    expect(shownDays(new Date(2026, 10, 23), 12)).toBe(78);
    expect(shownDays(new Date(2026, 10, 29), 12)).toBe(84);
  });
});

describe('lastDays', () => {
  it('keeps a best run inside the window', () => {
    const rows = series(WEDNESDAY, [1, 1, 1, 1, 0, 1]);
    expect(streaks(lastDays(rows, 3))).toEqual({ current: 1, best: 1 });
  });
});

describe('busiestWeekday', () => {
  it('names the weekday with the most sign-ins', () => {
    // 24 Nov is a Tuesday.
    const weeks = buildWeeks(series(WEDNESDAY, [3, 1]), WEDNESDAY, 2);
    expect(busiestWeekday(weeks)).toBe('Tuesday');
  });

  it('says nothing with too few sign-ins', () => {
    expect(busiestWeekday(buildWeeks(series(WEDNESDAY, [1, 1]), WEDNESDAY, 2))).toBeNull();
  });

  it('says nothing on a tie', () => {
    expect(busiestWeekday(buildWeeks(series(WEDNESDAY, [2, 2]), WEDNESDAY, 2))).toBeNull();
  });
});

describe('level', () => {
  it('maps counts to five shades, capped at four', () => {
    expect([0, 1, 2, 3, 4, 9].map(level)).toEqual([0, 1, 2, 3, 4, 4]);
  });
});
