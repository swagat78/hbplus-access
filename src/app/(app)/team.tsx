import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Notice } from '@/components/notice';
import { Page } from '@/components/page';
import { ActivityCard } from '@/features/activity/activity-card';
import { useAuth } from '@/features/auth/auth-provider';
import { MemberRow } from '@/features/team/member-row';
import { useTeamMembers } from '@/features/team/use-team-members';
import { useLayout } from '@/hooks/use-layout';
import { ALLOWED_DOMAIN } from '@/lib/domain';
import { colors, fonts, radius, space } from '@/theme';

export default function TeamScreen() {
  const { profile } = useAuth();
  const { width } = useLayout();
  const { members, loading, error, changeRole } = useTeamMembers();
  const [query, setQuery] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const compact = width < 720;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) => m.email.toLowerCase().includes(q) || m.full_name?.toLowerCase().includes(q),
    );
  }, [members, query]);

  const adminCount = members.filter((m) => m.role === 'admin').length;

  return (
    <Page
      eyebrow="Admin"
      title="Team"
      intro={`Everyone who has signed in with an @${ALLOWED_DOMAIN} account. Role changes go through a database function that checks you're an admin, so this screen can't be used to grant access on its own.`}
    >
      <Card>
        <View style={[styles.toolbar, compact && styles.toolbarCompact]}>
          <AppText variant="label">
            {members.length} {members.length === 1 ? 'member' : 'members'} · {adminCount}{' '}
            {adminCount === 1 ? 'admin' : 'admins'}
          </AppText>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name or email"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search team members"
            style={[styles.search, compact && styles.searchCompact]}
          />
        </View>

        {error ? <Notice message={error} /> : null}
        {actionError ? <Notice message={actionError} onDismiss={() => setActionError(null)} /> : null}

        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator color={colors.rust} />
          </View>
        ) : error && members.length === 0 ? null : filtered.length === 0 ? (
          <View style={styles.state}>
            <AppText variant="small">
              {query ? `No one matches “${query}”.` : 'No members yet.'}
            </AppText>
          </View>
        ) : (
          <View>
            {filtered.map((member, index) => (
              <MemberRow
                key={member.id}
                member={member}
                isSelf={member.id === profile?.id}
                compact={compact}
                last={index === filtered.length - 1}
                onChangeRole={changeRole}
                onError={setActionError}
              />
            ))}
          </View>
        )}
      </Card>

      {profile ? (
        <ActivityCard
          title="Audit log"
          caption="Every sign-in and role change, written by the database. Nobody can edit or delete these from the app."
          currentUserId={profile.id}
          limit={25}
        />
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
  },
  toolbarCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  search: {
    width: 280,
    height: 40,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cream,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
  },
  searchCompact: {
    width: '100%',
  },
  state: {
    paddingVertical: space.xxl,
    alignItems: 'center',
  },
});
