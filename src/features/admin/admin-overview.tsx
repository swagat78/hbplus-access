import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Segmented } from '@/components/segmented';
import { ACCENTS, StatGrid, StatTile } from '@/components/stat-tile';
import { ActivityCard } from '@/features/activity/activity-card';
import { useAuth } from '@/features/auth/auth-provider';
import { SignInChart } from '@/features/charts/sign-in-chart';
import { useTeamOverview } from '@/features/dashboard/use-team-overview';
import type { AdminTab } from '@/features/shell/nav';
import { useLayout } from '@/hooks/use-layout';
import { colors, fonts, radius, space } from '@/theme';

type Range = '7' | '14' | '30';

const RANGES: { value: Range; label: string }[] = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
];

const SHORTCUTS: { tab: AdminTab; icon: ComponentProps<typeof Feather>['name']; title: string; text: string }[] = [
  { tab: 'members', icon: 'users', title: 'Manage members', text: 'Promote, demote, suspend or restore' },
  { tab: 'access', icon: 'lock', title: 'Access rules', text: 'Choose which email domains can sign in' },
  { tab: 'audit', icon: 'list', title: 'Audit log', text: 'Every sign-in and admin change' },
];

export function AdminOverview() {
  const { profile } = useAuth();
  const { contentWidth } = useLayout();
  const { overview } = useTeamOverview();
  const [range, setRange] = useState<Range>('14');

  if (!profile) return null;

  const twoColumns = contentWidth >= 960;

  return (
    <View style={styles.panel}>
      <StatGrid>
        <StatTile
          label="Active members"
          value={overview?.members}
          caption="can sign in right now"
          icon="users"
          accent={ACCENTS.rust}
        />
        <StatTile
          label="Admins"
          value={overview?.admins}
          caption="can change roles and access"
          icon="shield"
          accent={ACCENTS.olive}
        />
        <StatTile
          label="Suspended"
          value={overview?.suspended}
          caption="blocked until restored"
          icon="pause-circle"
          accent={ACCENTS.danger}
        />
        <StatTile
          label="Allowed domains"
          value={overview?.domains}
          caption="email domains that can sign in"
          icon="globe"
          accent={ACCENTS.mist}
        />
      </StatGrid>

      {/* The range sits above the chart it scopes, never inside the card. */}
      <Segmented options={RANGES} value={range} onChange={setRange} accessibilityLabel="Date range" />
      <SignInChart
        days={Number(range)}
        title="Team sign-ins"
        caption={`Everyone on the team, last ${range} days`}
      />

      <View style={[styles.columns, twoColumns && styles.columnsRow]}>
        <View style={[styles.column, twoColumns && styles.main]}>
          <ActivityCard
            title="Recent admin actions"
            caption="Role, suspension and domain changes, newest first."
            currentUserId={profile.id}
            kinds={['role_changed', 'status_changed', 'domain_added', 'domain_removed']}
            limit={6}
          />
        </View>
        <View style={[styles.column, twoColumns && styles.side]}>
          <Card title="Shortcuts">
            <View style={styles.shortcuts}>
              {SHORTCUTS.map((shortcut) => (
                <Shortcut key={shortcut.tab} {...shortcut} />
              ))}
            </View>
          </Card>
        </View>
      </View>
    </View>
  );
}

function Shortcut({ tab, icon, title, text }: (typeof SHORTCUTS)[number]) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={() => router.setParams({ tab })}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.shortcut, (hovered || pressed) && styles.shortcutActive]}
    >
      <View style={styles.shortcutIcon}>
        <Feather name={icon} size={16} color={colors.inkSoft} />
      </View>
      <View style={styles.shortcutText}>
        <AppText style={styles.shortcutTitle}>{title}</AppText>
        <AppText variant="small">{text}</AppText>
      </View>
      <Feather name="arrow-right" size={16} color={hovered ? colors.rust : colors.faint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: space.xl,
  },
  columns: {
    gap: space.xl,
  },
  columnsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    gap: space.xl,
  },
  main: {
    flex: 1.55,
  },
  side: {
    flex: 1,
  },
  shortcuts: {
    gap: space.xs,
    marginHorizontal: -space.sm,
  },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.sm,
    borderRadius: radius.md,
  },
  shortcutActive: {
    backgroundColor: colors.cream,
  },
  shortcutIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm + 2,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutText: {
    flex: 1,
  },
  shortcutTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.ink,
  },
});
