import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppText } from '@/components/app-text';
import { Segmented } from '@/components/segmented';
import { colors, fonts, radius, space } from '@/theme';

import { PATHWAYS, type Pillar } from './pathways';

const GAP = space.lg;

const PILLAR_COLORS: Record<Pillar, { bg: string; fg: string }> = {
  Body: { bg: colors.rustTint, fg: colors.rust },
  Mind: { bg: colors.mist, fg: '#345A63' },
  Gut: { bg: '#EEF0E4', fg: '#516834' },
};

type Filter = 'all' | Pillar;

const FILTERS: { value: Filter; label: string; count: number }[] = [
  { value: 'all', label: 'All', count: PATHWAYS.length },
  ...(['Body', 'Mind', 'Gut'] as const).map((pillar) => ({
    value: pillar,
    label: pillar,
    count: PATHWAYS.filter((p) => p.pillars.includes(pillar)).length,
  })),
];

export function PathwayGrid() {
  // Sized from its own width so it works in any column, not just full-page.
  const [width, setWidth] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');

  const columns = width >= 900 ? 4 : width >= 520 ? 2 : 1;
  const cardWidth = width ? (width - GAP * (columns - 1)) / columns : undefined;
  const visible = filter === 'all' ? PATHWAYS : PATHWAYS.filter((p) => p.pillars.includes(filter));

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.header}>
          <AppText variant="heading">Our pathways</AppText>
          <AppText variant="small">What clients come to HB+ for, and which pillars each one draws on.</AppText>
        </View>
        <Segmented
          size="sm"
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          accessibilityLabel="Filter pathways by pillar"
        />
      </View>

      <View style={styles.grid} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {visible.map((pathway, index) => (
          <Animated.View
            key={`${filter}-${pathway.name}`}
            entering={FadeIn.duration(260).delay(index * 40)}
            style={[styles.card, { width: cardWidth }]}
          >
            <AppText style={styles.name}>{pathway.name}</AppText>
            <AppText variant="small" style={styles.blurb}>
              {pathway.blurb}
            </AppText>
            <View style={styles.tags}>
              {pathway.pillars.map((pillar) => (
                <View key={pillar} style={[styles.tag, { backgroundColor: PILLAR_COLORS[pillar].bg }]}>
                  <AppText style={[styles.tagText, { color: PILLAR_COLORS[pillar].fg }]}>{pillar}</AppText>
                </View>
              ))}
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: space.lg,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.md,
  },
  header: {
    flexShrink: 1,
    gap: space.xxs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg + space.xs,
    gap: space.sm,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    color: colors.ink,
  },
  blurb: {
    flexGrow: 1,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs + 2,
    marginTop: space.xs,
  },
  tag: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
  },
  tagText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 16,
  },
});
