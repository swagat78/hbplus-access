import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Segmented } from '@/components/segmented';
import { colors, fonts, radius, space } from '@/theme';
import type { DailySignIns } from '@/types/database';

import { useSignInStats } from './use-sign-in-stats';

// Plot = bars + headroom for the peak label. The x-axis band sits below it,
// inside the same container, so the card never grows a nested scroll.
const PLOT_HEIGHT = 140;
const HEADROOM = 20;
const BAR_AREA = PLOT_HEIGHT - HEADROOM;
const AXIS_HEIGHT = 22;
const Y_GUTTER = 28;
const MAX_BAR = 24;

const BAR = colors.rust;
const BAR_HOVER = '#B9582F';
const GRID = colors.sand;
const BASELINE = colors.line;

type ChartView = 'chart' | 'table';

const VIEW_OPTIONS = [
  { value: 'chart', label: 'Chart' },
  { value: 'table', label: 'Table' },
] as const;

type Props = {
  days: number;
  title: string;
  caption: string;
};

export function SignInChart({ days, title, caption }: Props) {
  const { rows, failed, stale } = useSignInStats(days);
  const [view, setView] = useState<ChartView>('chart');

  const total = rows?.reduce((sum, r) => sum + r.sign_ins, 0) ?? 0;
  const peak = rows?.reduce<DailySignIns | null>(
    (best, r) => (r.sign_ins > 0 && (!best || r.sign_ins >= best.sign_ins) ? r : best),
    null,
  );

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="heading">{title}</AppText>
          <AppText variant="small">{caption}</AppText>
        </View>
        <Segmented
          size="sm"
          options={VIEW_OPTIONS}
          value={view}
          onChange={setView}
          accessibilityLabel="Show sign-ins as"
        />
      </View>

      {rows === null ? (
        <View style={styles.placeholder}>
          {failed ? (
            <AppText variant="small">Sign-in numbers aren&apos;t available yet.</AppText>
          ) : (
            <ActivityIndicator color={colors.rust} />
          )}
        </View>
      ) : (
        <View style={[styles.body, stale && styles.stale]}>
          <View style={styles.summary}>
            <AppText style={styles.total}>{total.toLocaleString('en-GB')}</AppText>
            <AppText variant="small" style={styles.summaryText}>
              {total === 1 ? 'sign-in' : 'sign-ins'} in the last {days} days
              {peak ? ` · busiest ${formatDay(peak.bucket)}` : ''}
            </AppText>
          </View>
          {view === 'chart' ? <Bars rows={rows} /> : <Table rows={rows} />}
        </View>
      )}
    </Card>
  );
}

function Bars({ rows }: { rows: DailySignIns[] }) {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  const max = rows.reduce((m, r) => Math.max(m, r.sign_ins), 0);
  const top = niceCeil(max);
  const ticks = top % 2 === 0 ? [top, top / 2, 0] : [top, 0];

  const slot = rows.length ? Math.max(0, width - Y_GUTTER) / rows.length : 0;
  const barWidth = Math.max(3, Math.min(MAX_BAR, slot - 6));
  const peakIndex = max > 0 ? rows.map((r) => r.sign_ins).lastIndexOf(max) : -1;
  const labelEvery = slot >= 30 ? 1 : slot >= 16 ? 2 : 7;

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityLabel={`Daily sign-ins, highest ${max} in a day. Switch to the table for every value.`}
    >
      <View style={styles.plot}>
        {ticks.map((tick) => {
          const y = HEADROOM + BAR_AREA - (tick / top) * BAR_AREA;
          return (
            <View key={`line-${tick}`} style={[styles.gridRow, { top: y }]}>
              <AppText style={styles.tick}>{tick}</AppText>
              <View style={[styles.gridLine, { backgroundColor: tick === 0 ? BASELINE : GRID }]} />
            </View>
          );
        })}

        <View style={styles.barRow}>
          {width > 0
            ? rows.map((row, index) => (
                <Bar
                  key={row.bucket}
                  row={row}
                  index={index}
                  slot={slot}
                  barWidth={barWidth}
                  height={(row.sign_ins / top) * BAR_AREA}
                  isPeak={index === peakIndex}
                  active={active === index}
                  onActive={(on) => setActive(on ? index : null)}
                />
              ))
            : null}
        </View>
      </View>

      <View style={styles.axis}>
        {rows.map((row, index) => {
          const last = index === rows.length - 1;
          const show = last || (rows.length - 1 - index) % labelEvery === 0;
          return (
            <View key={`x-${row.bucket}`} style={[styles.axisSlot, { width: slot }]}>
              {show ? (
                <AppText style={[styles.axisLabel, last && styles.axisToday]} numberOfLines={1}>
                  {last ? 'Today' : String(Number(row.bucket.slice(8, 10)))}
                </AppText>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Bar({
  row,
  index,
  slot,
  barWidth,
  height,
  isPeak,
  active,
  onActive,
}: {
  row: DailySignIns;
  index: number;
  slot: number;
  barWidth: number;
  height: number;
  isPeak: boolean;
  active: boolean;
  onActive: (on: boolean) => void;
}) {
  const grown = useSharedValue(0);

  useEffect(() => {
    grown.set(withDelay(index * 22, withTiming(height, { duration: 560, easing: Easing.out(Easing.cubic) })));
  }, [grown, height, index]);

  const barStyle = useAnimatedStyle(() => ({ height: grown.get() }));
  const label = `${formatDay(row.bucket)}: ${row.sign_ins} ${row.sign_ins === 1 ? 'sign-in' : 'sign-ins'}`;

  return (
    <Pressable
      onHoverIn={() => onActive(true)}
      onHoverOut={() => onActive(false)}
      onFocus={() => onActive(true)}
      onBlur={() => onActive(false)}
      // No hover on touch screens: a tap toggles the readout instead.
      onPress={Platform.OS === 'web' ? undefined : () => onActive(!active)}
      accessibilityLabel={label}
      style={[styles.slot, { width: slot }, active && styles.slotActive]}
    >
      {isPeak && !active ? <AppText style={styles.peakLabel}>{row.sign_ins}</AppText> : null}
      <Animated.View
        style={[styles.bar, { width: barWidth, backgroundColor: active ? BAR_HOVER : BAR }, barStyle]}
      />
      {active ? (
        <View style={[styles.tooltip, { bottom: height + 8 }]}>
          <AppText style={styles.tooltipValue}>
            {row.sign_ins} {row.sign_ins === 1 ? 'sign-in' : 'sign-ins'}
          </AppText>
          <AppText style={styles.tooltipLabel}>
            {formatDay(row.bucket)}
            {row.people > 1 ? ` · ${row.people} people` : ''}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

function Table({ rows }: { rows: DailySignIns[] }) {
  const newestFirst = [...rows].reverse();

  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHead]}>
        <AppText style={[styles.th, styles.cellDay]}>Day</AppText>
        <AppText style={[styles.th, styles.cellNum]}>Sign-ins</AppText>
        <AppText style={[styles.th, styles.cellNum]}>People</AppText>
      </View>
      {newestFirst.map((row) => (
        <View key={row.bucket} style={styles.tableRow}>
          <AppText style={[styles.td, styles.cellDay]}>{formatDay(row.bucket)}</AppText>
          <AppText style={[styles.td, styles.cellNum]}>{row.sign_ins}</AppText>
          <AppText style={[styles.td, styles.cellNum]}>{row.people}</AppText>
        </View>
      ))}
    </View>
  );
}

// 3 -> 5, 7 -> 10, 12 -> 20: a clean top for the axis. Never below 1.
function niceCeil(value: number) {
  if (value <= 1) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 5, 10]) {
    if (step * pow >= value) return step * pow;
  }
  return 10 * pow;
}

function formatDay(bucket: string) {
  const [y, m, d] = bucket.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.lg,
  },
  headerText: {
    flex: 1,
    gap: space.xxs,
  },
  placeholder: {
    height: PLOT_HEIGHT + AXIS_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: space.md,
  },
  stale: {
    opacity: 0.5,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  total: {
    fontFamily: fonts.semibold,
    fontSize: 28,
    lineHeight: 32,
    color: colors.ink,
  },
  summaryText: {
    flexShrink: 1,
  },
  plot: {
    height: PLOT_HEIGHT,
  },
  gridRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: 1,
  },
  tick: {
    width: Y_GUTTER,
    marginTop: -1,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.faint,
    fontVariant: ['tabular-nums'],
  },
  gridLine: {
    flex: 1,
    height: 1,
  },
  barRow: {
    position: 'absolute',
    left: Y_GUTTER,
    right: 0,
    top: 0,
    bottom: PLOT_HEIGHT - HEADROOM - BAR_AREA,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  slot: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  slotActive: {
    zIndex: 5,
  },
  bar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  peakLabel: {
    marginBottom: 4,
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    lineHeight: 14,
    color: colors.inkSoft,
  },
  tooltip: {
    position: 'absolute',
    paddingHorizontal: space.sm + 2,
    paddingVertical: space.xs + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.ink,
    alignItems: 'center',
    zIndex: 5,
    minWidth: 96,
  },
  tooltipValue: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 17,
    color: colors.surface,
  },
  tooltipLabel: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 15,
    color: 'rgba(244,242,240,0.7)',
  },
  axis: {
    height: AXIS_HEIGHT,
    marginLeft: Y_GUTTER,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  axisSlot: {
    alignItems: 'center',
  },
  axisLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  axisToday: {
    fontFamily: fonts.semibold,
    color: colors.inkSoft,
  },
  table: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
  },
  tableHead: {
    backgroundColor: colors.cream,
  },
  th: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.inkSoft,
  },
  td: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  cellDay: {
    flex: 1,
  },
  cellNum: {
    width: 72,
    textAlign: 'right',
  },
});
