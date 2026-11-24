import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Segmented } from '@/components/segmented';
import { ActivityCard } from '@/features/activity/activity-card';
import { useAuth } from '@/features/auth/auth-provider';
import { space } from '@/theme';
import type { AuthEventKind } from '@/types/database';

type Filter = 'all' | 'signins' | 'roles' | 'access' | 'domains';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'signins', label: 'Sign-ins' },
  { value: 'roles', label: 'Roles' },
  { value: 'access', label: 'Suspensions' },
  { value: 'domains', label: 'Domains' },
];

const KINDS: Record<Filter, readonly AuthEventKind[] | undefined> = {
  all: undefined,
  signins: ['signed_in'],
  roles: ['role_changed'],
  access: ['status_changed'],
  domains: ['domain_added', 'domain_removed'],
};

const PAGE = 25;

export function AuditLogPanel() {
  const { profile } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');
  const [limit, setLimit] = useState(PAGE);

  if (!profile) return null;

  return (
    <View style={styles.panel}>
      <Segmented
        options={FILTERS}
        value={filter}
        onChange={(next) => {
          setFilter(next);
          setLimit(PAGE);
        }}
        accessibilityLabel="Filter the audit log"
      />
      <ActivityCard
        title="Audit log"
        caption="Written by the database itself. Nobody can edit or delete these from the app, admins included."
        currentUserId={profile.id}
        kinds={KINDS[filter]}
        limit={limit}
        onLoadMore={() => setLimit((current) => current + PAGE)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: space.lg,
  },
});
