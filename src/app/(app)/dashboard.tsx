import { StyleSheet, View } from 'react-native';

import { Page } from '@/components/page';
import { Reveal } from '@/components/reveal';
import { ACCENTS, StatGrid, StatTile } from '@/components/stat-tile';
import { ActivityCard } from '@/features/activity/activity-card';
import { useAuth } from '@/features/auth/auth-provider';
import { SignInChart } from '@/features/charts/sign-in-chart';
import { AccessChecks } from '@/features/dashboard/access-checks';
import { AdminCallout } from '@/features/dashboard/admin-callout';
import { HeroBanner } from '@/features/dashboard/hero-banner';
import { PathwayGrid } from '@/features/dashboard/pathway-grid';
import { ProfileCard } from '@/features/dashboard/profile-card';
import { ResourcesCard } from '@/features/dashboard/resources-card';
import { SessionRing } from '@/features/dashboard/session-ring';
import { TeamCard } from '@/features/dashboard/team-card';
import { useTeamOverview } from '@/features/dashboard/use-team-overview';
import { useLayout } from '@/hooks/use-layout';
import { useNow } from '@/hooks/use-now';
import { ALLOWED_DOMAIN, getEmailDomain } from '@/lib/domain';
import { minutesUntil } from '@/lib/format';
import { space } from '@/theme';

export default function DashboardScreen() {
  const { profile, session, isAdmin } = useAuth();
  const { contentWidth } = useLayout();
  const { overview, failed } = useTeamOverview();
  const now = useNow();

  if (!profile || !session) return null;

  const twoColumns = contentWidth >= 960;
  const minutesLeft = minutesUntil(session.expires_at, now);
  const lifetime = session.expires_in ? session.expires_in / 60 : 60;

  return (
    <Page>
      <Reveal>
        <HeroBanner profile={profile} now={now} />
      </Reveal>

      <Reveal delay={80}>
        <StatGrid>
          <StatTile
            label="Team members"
            value={overview?.members}
            caption={
              overview?.domains && overview.domains > 1
                ? `across ${overview.domains} allowed domains`
                : `with @${ALLOWED_DOMAIN} accounts`
            }
            icon="users"
            accent={ACCENTS.rust}
          />
          <StatTile
            label="Admins"
            value={overview?.admins}
            caption="can manage roles and access"
            icon="shield"
            accent={ACCENTS.olive}
          />
          <StatTile
            label="Active this week"
            value={overview?.active_week}
            caption="signed in in the last 7 days"
            icon="activity"
            accent={ACCENTS.mist}
          />
          <StatTile
            label="Session"
            value={minutesLeft}
            suffix="m"
            caption="until the token refreshes"
            icon="clock"
            accent={ACCENTS.sand}
            visual={minutesLeft === null ? null : <SessionRing fraction={minutesLeft / lifetime} />}
          />
        </StatGrid>
      </Reveal>

      <View style={[styles.columns, twoColumns && styles.columnsRow]}>
        <View style={[styles.column, twoColumns && styles.main]}>
          <Reveal delay={160}>
            <SignInChart
              days={14}
              title={isAdmin ? 'Team sign-ins' : 'Your sign-ins'}
              caption={isAdmin ? 'Everyone on the team, last 14 days' : 'Your account, last 14 days'}
            />
          </Reveal>
          <Reveal delay={220}>
            <ActivityCard
              title={isAdmin ? 'Team activity' : 'Your activity'}
              caption={
                isAdmin
                  ? 'Sign-ins, role and access changes across the team, newest first.'
                  : 'Your recent sign-ins and any changes to your access.'
              }
              currentUserId={profile.id}
              limit={6}
            />
          </Reveal>
          <Reveal delay={280}>
            <AccessChecks domain={getEmailDomain(profile.email) ?? ALLOWED_DOMAIN} />
          </Reveal>
        </View>

        <View style={[styles.column, twoColumns && styles.side]}>
          <Reveal delay={200}>
            <ProfileCard profile={profile} now={now} />
          </Reveal>
          <Reveal delay={260}>
            <TeamCard overview={overview} failed={failed} currentUserId={profile.id} />
          </Reveal>
          {isAdmin ? (
            <Reveal delay={320}>
              <AdminCallout />
            </Reveal>
          ) : null}
          <Reveal delay={360}>
            <ResourcesCard />
          </Reveal>
        </View>
      </View>

      <Reveal delay={200}>
        <PathwayGrid />
      </Reveal>
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
