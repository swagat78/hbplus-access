import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { useLayout } from '@/hooks/use-layout';
import { ALLOWED_DOMAIN } from '@/lib/domain';
import { colors, fonts, radius, space } from '@/theme';

import { useTeamOverview } from './use-team-overview';

type Tile = {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  caption: string;
  accent: { bg: string; fg: string };
};

export function StatTiles({ refreshInMinutes }: { refreshInMinutes: number | null }) {
  const overview = useTeamOverview();
  const { contentWidth } = useLayout();
  const fourUp = contentWidth >= 900;

  const count = (n: number | undefined) => (n === undefined ? '—' : String(n));

  const tiles: Tile[] = [
    {
      icon: 'users',
      label: 'Team members',
      value: count(overview?.members),
      caption: `with @${ALLOWED_DOMAIN} accounts`,
      accent: { bg: colors.rustTint, fg: colors.rust },
    },
    {
      icon: 'shield',
      label: 'Admins',
      value: count(overview?.admins),
      caption: 'can manage roles',
      accent: { bg: '#EEF0E4', fg: '#516834' },
    },
    {
      icon: 'activity',
      label: 'Active this week',
      value: count(overview?.active_week),
      caption: 'signed in in the last 7 days',
      accent: { bg: colors.mist, fg: '#345A63' },
    },
    {
      icon: 'clock',
      label: 'Session',
      value: refreshInMinutes === null ? '—' : `${refreshInMinutes}m`,
      caption: 'until the token refreshes',
      accent: { bg: colors.sand, fg: colors.inkSoft },
    },
  ];

  return (
    <View style={styles.grid}>
      {tiles.map((tile) => (
        <View key={tile.label} style={[styles.tile, { flexBasis: fourUp ? '22%' : '40%' }]}>
          <View style={styles.top}>
            <AppText variant="label">{tile.label}</AppText>
            <View style={[styles.icon, { backgroundColor: tile.accent.bg }]}>
              <Feather name={tile.icon} size={15} color={tile.accent.fg} />
            </View>
          </View>
          <AppText style={styles.value}>{tile.value}</AppText>
          <AppText variant="small" numberOfLines={2}>
            {tile.caption}
          </AppText>
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
  tile: {
    flexGrow: 1,
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
  value: {
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 42,
    color: colors.ink,
  },
});
