import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { colors, fonts, radius, space } from '@/theme';

import { AppText } from './app-text';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

type Props<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'md' | 'sm';
  accessibilityLabel?: string;
};

// Tabs, filters and range pickers all use this, so they look and behave the
// same everywhere. Scrolls sideways instead of wrapping on narrow screens.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  accessibilityLabel,
}: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.track} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
        {options.map((option) => (
          <Segment
            key={option.value}
            option={option}
            selected={option.value === value}
            small={size === 'sm'}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function Segment<T extends string>({
  option,
  selected,
  small,
  onPress,
}: {
  option: SegmentOption<T>;
  selected: boolean;
  small: boolean;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      style={[
        styles.segment,
        small && styles.segmentSmall,
        hovered && !selected && styles.segmentHover,
        selected && styles.segmentSelected,
      ]}
    >
      <AppText style={[styles.label, small && styles.labelSmall, selected && styles.labelSelected]}>
        {option.label}
      </AppText>
      {option.count !== undefined ? (
        <View style={[styles.count, selected && styles.countSelected]}>
          <AppText style={styles.countText}>{option.count}</AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroller: {
    flexGrow: 0,
  },
  scrollContent: {
    flexGrow: 0,
  },
  track: {
    flexDirection: 'row',
    gap: space.xxs,
    padding: space.xs,
    borderRadius: radius.md,
    backgroundColor: colors.sand,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm - 2,
    height: 36,
    paddingHorizontal: space.md + 2,
    borderRadius: radius.sm,
  },
  segmentSmall: {
    height: 28,
    paddingHorizontal: space.md - 2,
  },
  segmentHover: {
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  segmentSelected: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.muted,
  },
  labelSmall: {
    fontSize: 12.5,
  },
  labelSelected: {
    color: colors.ink,
  },
  count: {
    minWidth: 20,
    paddingHorizontal: 6,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  countSelected: {
    backgroundColor: colors.rustTint,
  },
  countText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.inkSoft,
  },
});
