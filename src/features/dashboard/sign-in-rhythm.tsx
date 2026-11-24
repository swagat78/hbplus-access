import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { formatDate } from '@/lib/format';
import { colors, fonts, space } from '@/theme';
import type { DailySignIns } from '@/types/database';

import { buildWeeks, busiestWeekday, dayKey, level, type RhythmDay } from './rhythm';

export const RHYTHM_WEEKS = 12;
const WEEKS = RHYTHM_WEEKS;
const GAP = space.xs;
const GUTTER = 28;
const MAX_CELL = 22;
const MONTH_ROW = 18;

// One hue, light to dark: the more sign-ins on a day, the darker its square.
// The ends are theme colours. The steps between are not: the theme's lightest
// rust (rustBorder, 1.5:1 on white) made a day with one sign-in, the most
// common kind, too faint to see. One sign-in is now 2.2:1, then 3.4, 5.1, 6.5.
const RUST_LIGHT = '#DDA488';
const RUST_MID = '#C87654';
const RUST_DEEP = '#B0532D';
const SHADES = [colors.sand, RUST_LIGHT, RUST_MID, RUST_DEEP, colors.rust];

const WEEKDAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

// Short enough to share one line with the legend on a phone.
const HINT = Platform.OS === 'web' ? 'Hover or tap a day' : 'Tap a day';

type Props = {
  rows: DailySignIns[] | null;
  failed: boolean;
  joinedAt: string;
  now: number;
};

export function SignInRhythm({ rows, failed, joinedAt, now }: Props) {
  return (
    <Card title="Sign-in rhythm" caption="One square per day over your last 12 weeks.">

      {rows === null ? (
        <View style={styles.state}>
          {failed ? (
            <AppText variant="small">Your sign-in history isn&apos;t available yet.</AppText>
          ) : (
            <ActivityIndicator color={colors.rust} />
          )}
        </View>
      ) : (
        <Calendar rows={rows} joinedAt={joinedAt} now={now} />
      )}
    </Card>
  );
}

function Calendar({ rows, joinedAt, now }: { rows: DailySignIns[]; joinedAt: string; now: number }) {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<RhythmDay | null>(null);

  // 84 cells: cheap enough to rebuild on every render.
  const weeks = buildWeeks(rows, new Date(now), WEEKS);

  const cell = width
    ? Math.max(10, Math.min(MAX_CELL, Math.floor((width - GUTTER - GAP * (WEEKS - 1)) / WEEKS)))
    : MAX_CELL;
  const pitch = cell + GAP;

  const summary = summarize(weeks, joinedAt);

  return (
    <View style={styles.body}>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        // The visible summary under the grid is read out on its own, so the
        // label only names the picture.
        accessibilityRole="image"
        accessibilityLabel={`Sign-in calendar for the last ${WEEKS} weeks`}
      >
        <View style={[styles.months, { height: MONTH_ROW }]}>
          {monthLabels(weeks).map(({ index, label }) => (
            <AppText key={label + index} style={[styles.micro, styles.month, { left: GUTTER + index * pitch }]}>
              {label}
            </AppText>
          ))}
        </View>

        <View style={styles.grid}>
          <View style={[styles.gutter, { width: GUTTER }]}>
            {WEEKDAY_LABELS.map((label, d) => (
              <View key={d} style={[styles.weekdaySlot, { height: cell, marginBottom: d < 6 ? GAP : 0 }]}>
                <AppText style={styles.micro}>{label}</AppText>
              </View>
            ))}
          </View>

          {weeks.map((week, w) => (
            <View key={week[0].key} style={{ marginRight: w < WEEKS - 1 ? GAP : 0 }}>
              {week.map((day, d) => (
                <Cell
                  key={day.key}
                  day={day}
                  size={cell}
                  last={d === 6}
                  active={active?.key === day.key}
                  onActive={(on) => setActive(on ? day : null)}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* For pointer and touch only: the days can't be reached by keyboard or
          screen reader, which get the summary below instead. */}
      <View style={styles.footer} aria-hidden>
        <AppText style={[styles.micro, styles.readout, active && styles.readoutActive]} numberOfLines={1}>
          {active ? describeDay(active) : HINT}
        </AppText>
        <View style={styles.legend}>
          <AppText style={styles.micro}>Less</AppText>
          {SHADES.map((shade) => (
            <View key={shade} style={[styles.swatch, { backgroundColor: shade }]} />
          ))}
          <AppText style={styles.micro}>More</AppText>
        </View>
      </View>

      <AppText variant="small">{summary}</AppText>
    </View>
  );
}

function Cell({
  day,
  size,
  last,
  active,
  onActive,
}: {
  day: RhythmDay;
  size: number;
  last: boolean;
  active: boolean;
  onActive: (on: boolean) => void;
}) {
  const box = { width: size, height: size, marginBottom: last ? 0 : GAP };

  // Later this week: keep the slot so the grid stays square, draw nothing.
  if (day.isFuture) return <View style={box} />;

  return (
    <Pressable
      onHoverIn={() => onActive(true)}
      onHoverOut={() => onActive(false)}
      // Touch screens have no hover, so a tap picks the day. In the app a second
      // tap clears it, as on the chart. On the web a tap only selects, because
      // there a click comes right after the hover that already selected it.
      onPress={Platform.OS === 'web' ? () => onActive(true) : () => onActive(!active)}
      // The whole calendar is one labelled image; single days aren't tab stops.
      focusable={false}
      style={[
        styles.cell,
        box,
        { backgroundColor: SHADES[level(day.count)] },
        day.isToday && styles.today,
        active && styles.cellActive,
      ]}
    />
  );
}

function describeDay(day: RhythmDay) {
  const [y, m, d] = day.key.split('-').map(Number);
  const date = day.isToday
    ? 'Today'
    : new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const count = day.count === 0 ? 'no sign-ins' : `${day.count} ${day.count === 1 ? 'sign-in' : 'sign-ins'}`;
  return `${date} · ${count}`;
}

function summarize(weeks: RhythmDay[][], joinedAt: string) {
  const days = weeks.flat().filter((d) => !d.isFuture);
  const active = days.filter((d) => d.count > 0).length;
  if (active === 0) return 'No sign-ins in the last 12 weeks yet.';

  const joinedKey = dayKey(new Date(joinedAt));
  const since = joinedKey > days[0].key ? `since ${formatDate(joinedAt)}` : 'in the last 12 weeks';
  const busiest = busiestWeekday(weeks);

  return `Signed in on ${active} ${active === 1 ? 'day' : 'days'} ${since}${busiest ? `, most often on ${busiest}s` : ''}.`;
}

// A month's name over the first column that starts in it. The first column
// is only labelled if the next month is at least three columns away, so two
// names never collide.
function monthLabels(weeks: RhythmDay[][]) {
  const monthOf = (w: number) => weeks[w][0].key.slice(0, 7);
  const name = (w: number) => {
    const [y, m] = monthOf(w).split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short' });
  };

  const labels: { index: number; label: string }[] = [];
  weeks.forEach((_, w) => {
    if (w === 0) {
      if (weeks.length > 2 && monthOf(1) === monthOf(0) && monthOf(2) === monthOf(0)) {
        labels.push({ index: 0, label: name(0) });
      }
    } else if (monthOf(w) !== monthOf(w - 1)) {
      labels.push({ index: w, label: name(w) });
    }
  });
  return labels;
}

const styles = StyleSheet.create({
  state: {
    paddingVertical: space.xl,
    alignItems: 'center',
  },
  body: {
    gap: space.md,
  },
  months: {
    position: 'relative',
  },
  month: {
    position: 'absolute',
    top: 0,
  },
  grid: {
    flexDirection: 'row',
  },
  gutter: {
    justifyContent: 'flex-start',
  },
  weekdaySlot: {
    justifyContent: 'center',
  },
  micro: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.muted,
  },
  cell: {
    borderRadius: 4,
  },
  today: {
    borderWidth: 1,
    borderColor: colors.ink,
  },
  cellActive: {
    borderWidth: 2,
    borderColor: colors.ink,
  },
  // One line, always: the readout shrinks rather than pushing the legend down,
  // so pointing at a day never changes the card's height.
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  readout: {
    flex: 1,
    fontVariant: ['tabular-nums'],
  },
  readoutActive: {
    fontFamily: fonts.semibold,
    color: colors.inkSoft,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
