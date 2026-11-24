import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useReducedMotion, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/app-text';
import { FloatingOrb } from '@/components/floating-orb';
import { Wordmark } from '@/components/wordmark';
import { useCountUp } from '@/hooks/use-count-up';
import { colors, fonts, radius, space } from '@/theme';

const PILLARS = ['Body', 'Mind', 'Gut'];

// Public numbers from hbplus.fit.
const STATS = [
  { value: 1550, suffix: '+', label: 'lives transformed' },
  { value: 59800, suffix: '+', label: 'sessions completed' },
  { value: 8, suffix: '+', label: 'countries' },
];

type Props = {
  compact?: boolean;
  topInset?: number;
};

export function BrandPanel({ compact, topInset = 0 }: Props) {
  const reduceMotion = useReducedMotion();
  const [activePillar, setActivePillar] = useState(0);

  // Body -> Mind -> Gut, one at a time: a quiet nod to how HB+ works.
  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => setActivePillar((i) => (i + 1) % PILLARS.length), 2400);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  return (
    <View
      style={[
        styles.panel,
        compact ? styles.compact : styles.full,
        { paddingTop: (compact ? space.xl : space.xxxl) + topInset },
      ]}
    >
      <View style={styles.glowClip}>
        <FloatingOrb
          size={compact ? 320 : 520}
          color={colors.rust}
          opacity={0.3}
          style={compact ? styles.orbRustCompact : styles.orbRust}
          drift={compact ? 12 : 22}
          duration={10000}
        />
        <FloatingOrb
          size={360}
          color={colors.mist}
          opacity={0.06}
          style={styles.orbMist}
          drift={14}
          duration={12000}
          delay={1500}
        />
      </View>

      <Animated.View entering={FadeInDown.duration(500)}>
        <Wordmark size={compact ? 26 : 30} inverted caption="Team space" />
      </Animated.View>

      <View style={compact ? styles.copyCompact : styles.copy}>
        <Animated.View entering={FadeInDown.duration(500).delay(90)}>
          <AppText variant="eyebrow" color="#E3A58C">
            Internal access
          </AppText>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(550).delay(160)}>
          <AppText
            variant="display"
            color={colors.cream}
            style={compact ? styles.headlineCompact : styles.headline}
          >
            The team behind every pathway.
          </AppText>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(550).delay(240)}>
          <AppText variant="body" color="rgba(244,242,240,0.72)" style={styles.lede}>
            Coaches, physios, nutritionists and everyone who keeps HB+ running. Sign in with your
            work Google account to continue.
          </AppText>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(550).delay(320)} style={styles.pillars}>
          {PILLARS.map((pillar, index) => (
            <PillarChip key={pillar} label={pillar} active={!reduceMotion && index === activePillar} />
          ))}
        </Animated.View>
      </View>

      {compact ? null : (
        <Animated.View entering={FadeInDown.duration(550).delay(420)} style={styles.stats}>
          {STATS.map((stat) => (
            <Stat key={stat.label} {...stat} />
          ))}
        </Animated.View>
      )}
    </View>
  );
}

function PillarChip({ label, active }: { label: string; active: boolean }) {
  const animated = useAnimatedStyle(() => ({
    backgroundColor: withTiming(active ? 'rgba(217,100,58,0.24)' : 'rgba(217,100,58,0)', { duration: 450 }),
    borderColor: withTiming(active ? 'rgba(217,100,58,0.7)' : 'rgba(244,242,240,0.22)', { duration: 450 }),
  }));

  return (
    <Animated.View style={[styles.pillar, animated]}>
      <AppText style={styles.pillarText}>{label}</AppText>
    </Animated.View>
  );
}

function Stat({ value, suffix, label }: (typeof STATS)[number]) {
  const shown = useCountUp(value, 1400);

  return (
    <View style={styles.stat}>
      <AppText style={styles.statValue}>
        {(shown ?? 0).toLocaleString('en-GB')}
        {suffix}
      </AppText>
      <AppText variant="small" color="rgba(244,242,240,0.55)">
        {label}
      </AppText>
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
  glowClip: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  orbRust: {
    right: -220,
    top: -180,
  },
  orbRustCompact: {
    right: -140,
    top: -120,
  },
  orbMist: {
    left: -200,
    bottom: -220,
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
