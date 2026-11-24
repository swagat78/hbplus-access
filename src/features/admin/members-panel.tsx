import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Notice } from '@/components/notice';
import { Segmented } from '@/components/segmented';
import { TextField } from '@/components/text-field';
import { useAuth } from '@/features/auth/auth-provider';
import { useLayout } from '@/hooks/use-layout';
import { colors, space } from '@/theme';
import type { Profile } from '@/types/database';

import { MemberRow } from './member-row';
import { useMembers } from './use-members';

type Filter = 'all' | 'admins' | 'members' | 'suspended';

const MATCHES: Record<Filter, (m: Profile) => boolean> = {
  all: () => true,
  admins: (m) => m.role === 'admin',
  members: (m) => m.role === 'user',
  suspended: (m) => m.status === 'suspended',
};

export function MembersPanel() {
  const { profile } = useAuth();
  const { contentWidth } = useLayout();
  const { members, error, changeRole, changeStatus } = useMembers();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const compact = contentWidth < 820;
  const list = useMemo(() => members ?? [], [members]);

  const options = (['all', 'admins', 'members', 'suspended'] as const).map((value) => ({
    value,
    label: value === 'all' ? 'All' : value[0].toUpperCase() + value.slice(1),
    count: list.filter(MATCHES[value]).length,
  }));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter(
      (m) =>
        MATCHES[filter](m) &&
        (!q || m.email.toLowerCase().includes(q) || m.full_name?.toLowerCase().includes(q)),
    );
  }, [list, filter, query]);

  return (
    <View style={styles.panel}>
      <View style={[styles.toolbar, compact && styles.toolbarCompact]}>
        <Segmented options={options} value={filter} onChange={setFilter} accessibilityLabel="Filter members" />
        <TextField
          icon="search"
          value={query}
          onChangeText={setQuery}
          placeholder="Search name or email"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search members"
          style={compact ? undefined : styles.search}
        />
      </View>

      {error ? <Notice message={error} /> : null}
      {actionError ? <Notice message={actionError} onDismiss={() => setActionError(null)} /> : null}

      <Card>
        {members === null && !error ? (
          <View style={styles.state}>
            <ActivityIndicator color={colors.rust} />
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.state}>
            <AppText variant="small">
              {query ? `No one matches “${query}”.` : 'No one in this list yet.'}
            </AppText>
          </View>
        ) : (
          <View>
            {visible.map((member, index) => (
              <MemberRow
                key={member.id}
                member={member}
                isSelf={member.id === profile?.id}
                compact={compact}
                last={index === visible.length - 1}
                onChangeRole={changeRole}
                onChangeStatus={changeStatus}
                onError={setActionError}
              />
            ))}
          </View>
        )}
      </Card>

      <AppText variant="small" style={styles.footnote}>
        Suspending someone takes effect on their next request: they lose access to team data straight
        away and are signed out the next time their app checks in. Their history stays in the audit log.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: space.lg,
  },
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
    width: 300,
  },
  state: {
    paddingVertical: space.xxl,
    alignItems: 'center',
  },
  footnote: {
    maxWidth: 720,
  },
});
