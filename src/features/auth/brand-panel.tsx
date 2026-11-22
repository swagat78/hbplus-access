import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Wordmark } from '@/components/wordmark';
import { colors, fonts, radius, space } from '@/theme';

const PILLARS = ['Body', 'Mind', 'Gut'];

// Public numbers from hbplus.fit.
const STATS = [
  { value: '1,550+', label: 'lives transformed' },
  { value: '59,800+', label: 'sessions completed' },
  { value: '8+', label: 'countries' },
];

type Props = {
  compact?: boolean;
  topInset?: number;
};

export function BrandPanel({ compact, topInset = 0 }: Props) {
  return (
    <View
      style={[
        styles.panel,
        compact ? styles.compact : styles.full,
        { paddingTop: (compact ? space.xl : space.xxxl) + topInset },
      ]}
    >
      <View pointerEvents="none" style={[styles.glow, styles.glowRust, compact && styles.glowCompact]} />
      <View pointerEvents="none" style={[styles.glow, styles.glowMist]} />

      <Wordmark size={compact ? 26 : 30} inverted caption="Team space" />

      <View style={compact ? styles.copyCompact : styles.copy}>
        <AppText variant="eyebrow" color="#E3A58C">
          Internal access
        </AppText>
        <AppText
          variant="display"
          color={colors.cream}
          style={compact ? styles.headlineCompact : styles.headline}
        >
          The team behind every pathway.
        </AppText>
        <AppText variant="body" color="rgba(244,242,240,0.72)" style={styles.lede}>
          Coaches, physios, nutritionists and everyone who keeps HB+ running. Sign in with your
          work Google account to continue.
        </AppText>

        <View style={styles.pillars}>
          {PILLARS.map((pillar) => (
            <View key={pillar} style={styles.pillar}>
              <AppText style={styles.pillarText}>{pillar}</AppText>
            </View>
          ))}
        </View>
      </View>

      {compact ? null : (
        <View style={styles.stats}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <AppText style={styles.statValue}>{stat.value}</AppText>
              <AppText variant="small" color="rgba(244,242,240,0.55)">
                {stat.label}
              </AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.ink,
    overflow: 'hidden',
    paddingHorizontal: space.xxl,
  },
  full: {
    flex: 1,
    paddingBottom: space.xxxl,
    justifyContent: 'space-between',
  },
  compact: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl + space.xl,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowRust: {
    width: 520,
    height: 520,
    right: -220,
    top: -180,
    backgroundColor: colors.rust,
    opacity: 0.28,
  },
  glowCompact: {
    width: 320,
    height: 320,
    right: -140,
    top: -120,
  },
  glowMist: {
    width: 360,
    height: 360,
    left: -200,
    bottom: -220,
    backgroundColor: colors.mist,
    opacity: 0.06,
  },
  copy: {
    maxWidth: 520,
    gap: space.lg,
  },
  copyCompact: {
    marginTop: space.xxl,
    gap: space.md,
  },
  headline: {
    fontSize: 56,
    lineHeight: 62,
  },
  headlineCompact: {
    fontSize: 34,
    lineHeight: 40,
  },
  lede: {
    maxWidth: 440,
  },
  pillars: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.xs,
  },
  pillar: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 1,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(244,242,240,0.22)',
  },
  pillarText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.cream,
  },
  stats: {
    flexDirection: 'row',
    gap: space.xxl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(244,242,240,0.12)',
    paddingTop: space.xl,
  },
  stat: {
    gap: space.xxs,
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 30,
    color: colors.cream,
  },
});
