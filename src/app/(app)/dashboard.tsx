import { StyleSheet, View } from 'react-native';

import { Page } from '@/components/page';
import { ActivityCard } from '@/features/activity/activity-card';
import { useAuth } from '@/features/auth/auth-provider';
import { AccessChecks } from '@/features/dashboard/access-checks';
import { AdminCallout } from '@/features/dashboard/admin-callout';
import { HeroBanner } from '@/features/dashboard/hero-banner';
import { PathwayGrid } from '@/features/dashboard/pathway-grid';
import { ProfileCard } from '@/features/dashboard/profile-card';
import { ResourcesCard } from '@/features/dashboard/resources-card';
import { StatTiles } from '@/features/dashboard/stat-tiles';
import { useLayout } from '@/hooks/use-layout';
import { useNow } from '@/hooks/use-now';
import { minutesUntil } from '@/lib/format';
import { space } from '@/theme';

export default function DashboardScreen() {
  const { profile, session, isAdmin } = useAuth();
  const { contentWidth } = useLayout();
  const now = useNow();

  if (!profile || !session) return null;

  const twoColumns = contentWidth >= 960;

  return (
    <Page>
      <HeroBanner profile={profile} now={now} />

      <StatTiles refreshInMinutes={minutesUntil(session.expires_at, now)} />

      <View style={[styles.columns, twoColumns && styles.columnsRow]}>
        <View style={[styles.column, twoColumns && styles.main]}>
          <ActivityCard
            title={isAdmin ? 'Team activity' : 'Your activity'}
            caption={
              isAdmin
                ? 'Sign-ins and role changes across the team, newest first.'
                : 'Your recent sign-ins and any changes to your access.'
            }
            currentUserId={profile.id}
          />
          <AccessChecks />
        </View>

        <View style={[styles.column, twoColumns && styles.side]}>
          <ProfileCard profile={profile} now={now} />
          {isAdmin ? <AdminCallout /> : null}
          <ResourcesCard />
        </View>
      </View>

      <PathwayGrid />
    </Page>
  );
}

const styles = StyleSheet.create({
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
});
