import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { FloatingOrb } from '@/components/floating-orb';
import { useLayout } from '@/hooks/use-layout';
import { getEmailDomain } from '@/lib/domain';
import { firstName, greeting } from '@/lib/format';
import { colors, fonts, radius, space } from '@/theme';
import type { Profile } from '@/types/database';

type Props = {
  profile: Profile;
  now: number;
};

export function HeroBanner({ profile, now }: Props) {
  const { contentWidth } = useLayout();
  const roomy = contentWidth >= 900;
  const date = new Date(now);
  const isAdmin = profile.role === 'admin';

  return (
    <View style={[styles.banner, roomy && styles.bannerRoomy]}>
      <View style={styles.glowClip}>
        <FloatingOrb size={420} color={colors.rust} opacity={0.34} style={styles.orbRust} drift={18} />
        <FloatingOrb size={260} color={colors.mist} opacity={0.07} style={styles.orbMist} drift={12} delay={1200} />
      </View>

      <View style={styles.copy}>
        <View style={styles.eyebrowRow}>
          <View style={styles.liveDot} />
          <AppText variant="eyebrow" color="#E3A58C">
            {date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </AppText>
        </View>
        <AppText variant={roomy ? 'display' : 'title'} color={colors.cream}>
          {greeting(date)}, {firstName(profile.full_name, profile.email)}.
        </AppText>
        <AppText variant="body" color="rgba(244,242,240,0.7)" style={styles.lede}>
          {isAdmin
            ? 'You have admin access. The admin panel has members, access rules and the full audit log.'
            : 'Welcome to the HB+ team space. Your account, your recent activity and the HB+ pathways are all here.'}
        </AppText>
      </View>

      <View style={[styles.chips, roomy && styles.chipsRoomy]}>
        <Chip icon="check-circle" tint="#7BC48A" label={`@${getEmailDomain(profile.email)} verified`} />
        <Chip icon={isAdmin ? 'shield' : 'user'} label={isAdmin ? 'Admin access' : 'Member access'} />
        <Chip icon="lock" label="Google OAuth · PKCE" />
      </View>
    </View>
  );
}

function Chip({
  icon,
  label,
  tint = 'rgba(244,242,240,0.7)',
}: {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  tint?: string;
}) {
  return (
    <View style={styles.chip}>
      <Feather name={icon} size={13} color={tint} />
      <AppText style={styles.chipText}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: space.xl,
    gap: space.xl,
    overflow: 'hidden',
  },
  bannerRoomy: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: space.xxl + space.sm,
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
    right: -120,
    top: -250,
  },
  orbMist: {
    left: -120,
    bottom: -170,
  },
  copy: {
    flexShrink: 1,
    gap: space.sm,
    maxWidth: 620,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7BC48A',
  },
  lede: {
    marginTop: space.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  chipsRoomy: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    flexWrap: 'nowrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: space.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.cream,
  },
});
