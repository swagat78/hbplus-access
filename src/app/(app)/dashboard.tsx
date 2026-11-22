import { router } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { InfoRow } from '@/components/info-row';
import { Page } from '@/components/page';
import { RoleBadge } from '@/components/role-badge';
import { useAuth } from '@/features/auth/auth-provider';
import { AccessChecks } from '@/features/dashboard/access-checks';
import { PathwayGrid } from '@/features/dashboard/pathway-grid';
import { useLayout } from '@/hooks/use-layout';
import { useNow } from '@/hooks/use-now';
import { firstName, formatDate, greeting, minutesUntil, timeAgo } from '@/lib/format';
import { colors, fonts, radius, space } from '@/theme';

const TOKEN_STORAGE = Platform.OS === 'web' ? 'Browser storage' : 'Keychain / Keystore';

export default function DashboardScreen() {
  const { profile, session, isAdmin } = useAuth();
  const { isWide } = useLayout();
  const now = useNow();

  if (!profile || !session) return null;

  const today = new Date(now).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const refreshIn = minutesUntil(session.expires_at, now);

  return (
    <Page
      eyebrow={today}
      title={`${greeting(new Date(now))}, ${firstName(profile.full_name, profile.email)}.`}
      intro="You're signed in to the HB+ team space. Here's your account, your session, and the checks that let you in."
    >
      <View style={[styles.columns, isWide && styles.columnsWide]}>
        <View style={[styles.column, isWide && { flex: 1.15 }]}>
          <Card>
            <View style={styles.identity}>
              <Avatar name={profile.full_name} email={profile.email} uri={profile.avatar_url} size={56} />
              <View style={styles.identityText}>
                <AppText style={styles.name} numberOfLines={1}>
                  {profile.full_name ?? profile.email}
                </AppText>
                <AppText variant="small" numberOfLines={1}>
                  {profile.email}
                </AppText>
              </View>
              <RoleBadge role={profile.role} />
            </View>

            <View>
              <InfoRow label="Domain" value={<VerifiedPill />} />
              <InfoRow label="Member since" value={formatDate(profile.created_at)} />
              <InfoRow label="Last sign-in" value={timeAgo(profile.last_sign_in_at, now)} />
              <InfoRow label="Provider" value="Google" last />
            </View>
          </Card>

          <Card title="Session" caption="Tokens refresh in the background while the app is open.">
            <View>
              <InfoRow
                label="Access token"
                value={refreshIn === null ? '—' : refreshIn === 0 ? 'Refreshing…' : `Refreshes in ${refreshIn} min`}
              />
              <InfoRow label="Stored in" value={TOKEN_STORAGE} />
              <InfoRow label="Flow" value="OAuth 2.0 + PKCE" last />
            </View>
          </Card>
        </View>

        <View style={[styles.column, isWide && { flex: 1 }]}>
          <AccessChecks />

          {isAdmin ? (
            <View style={styles.adminCard}>
              <AppText variant="eyebrow" color="#E3A58C">
                Admin
              </AppText>
              <AppText style={styles.adminTitle}>You can manage team access.</AppText>
              <AppText variant="small" color="rgba(244,242,240,0.7)">
                See everyone who has signed in and promote or demote admins. Changes are enforced in
                the database, not just in this screen.
              </AppText>
              <Button
                label="Open team"
                tone="primary"
                onPress={() => router.navigate('/team')}
                style={styles.adminButton}
              />
            </View>
          ) : null}
        </View>
      </View>

      <PathwayGrid />
    </Page>
  );
}

function VerifiedPill() {
  const { profile } = useAuth();
  const domain = profile?.email.split('@')[1];

  return (
    <View style={styles.verified}>
      <AppText style={styles.verifiedText}>@{domain} · verified</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  columns: {
    gap: space.xl,
  },
  columnsWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    gap: space.xl,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
  },
  identityText: {
    flex: 1,
    gap: space.xxs,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.ink,
  },
  verified: {
    backgroundColor: colors.successTint,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm + 2,
    paddingVertical: space.xxs + 1,
  },
  verifiedText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.success,
  },
  adminCard: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: space.xl,
    gap: space.sm,
  },
  adminTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
    color: colors.cream,
  },
  adminButton: {
    alignSelf: 'flex-start',
    marginTop: space.md,
  },
});
