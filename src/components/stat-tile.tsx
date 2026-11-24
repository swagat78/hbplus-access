import Feather from '@expo/vector-icons/Feather';
import { Children, type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useCountUp } from '@/hooks/use-count-up';
import { useLayout } from '@/hooks/use-layout';
import { colors, fonts, radius, space } from '@/theme';

import { AppText } from './app-text';

export type StatAccent = { bg: string; fg: string };

export const ACCENTS = {
  rust: { bg: colors.rustTint, fg: colors.rust },
  olive: { bg: '#EEF0E4', fg: '#516834' },
  mist: { bg: colors.mist, fg: '#345A63' },
  sand: { bg: colors.sand, fg: colors.inkSoft },
  danger: { bg: colors.dangerTint, fg: colors.danger },
} satisfies Record<string, StatAccent>;

type Props = {
  label: string;
  value: number | null | undefined;
  suffix?: string;
  caption: string;
  icon: ComponentProps<typeof Feather>['name'];
  accent: StatAccent;
  // Optional figure beside the number, e.g. the session ring.
  visual?: ReactNode;
};

export function StatTile({ label, value, suffix = '', caption, icon, accent, visual }: Props) {
  const shown = useCountUp(value);

  return (
    <View style={styles.tile}>
      <View style={styles.top}>
        <AppText variant="label">{label}</AppText>
        <View style={[styles.icon, { backgroundColor: accent.bg }]}>
          <Feather name={icon} size={15} color={accent.fg} />
        </View>
      </View>
      <View style={styles.valueRow}>
        <AppText style={styles.value}>
          {shown === null ? '—' : `${shown.toLocaleString('en-GB')}${suffix}`}
        </AppText>
        {visual}
      </View>
      <AppText variant="small" numberOfLines={2}>
        {caption}
      </AppText>
    </View>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  const { contentWidth } = useLayout();
  const fourUp = contentWidth >= 900;

  return (
    <View style={styles.grid}>
      {Children.toArray(children).map((child, i) => (
        <View key={i} style={[styles.cell, { flexBasis: fourUp ? '22%' : '40%' }]}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.lg,
  },
  cell: {
    flexGrow: 1,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg + space.xs,
    gap: space.xs,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  // Sans, not the display serif: numbers read as data, not decoration.
  value: {
    fontFamily: fonts.semibold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
    color: colors.ink,
  },
});
