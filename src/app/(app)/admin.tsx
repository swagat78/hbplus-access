import { router, useLocalSearchParams } from 'expo-router';
import type { ComponentType } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Page } from '@/components/page';
import { Segmented } from '@/components/segmented';
import { AccessRulesPanel } from '@/features/admin/access-rules-panel';
import { AdminOverview } from '@/features/admin/admin-overview';
import { AuditLogPanel } from '@/features/admin/audit-log-panel';
import { MembersPanel } from '@/features/admin/members-panel';
import { ADMIN_TABS, toAdminTab, type AdminTab } from '@/features/shell/nav';
import { space } from '@/theme';

const PANELS: Record<AdminTab, ComponentType> = {
  overview: AdminOverview,
  members: MembersPanel,
  access: AccessRulesPanel,
  audit: AuditLogPanel,
};

export default function AdminScreen() {
  // The tab lives in the URL (/admin?tab=members) so it survives a refresh
  // and can be linked to from the sidebar.
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const current = toAdminTab(tab);
  const Panel = PANELS[current];

  return (
    <Page
      eyebrow="Admin"
      title="Admin panel"
      intro="Members, access rules and the audit log. Every action here is checked again by the database, so the UI can't grant more than an admin is allowed."
    >
      <Segmented
        options={ADMIN_TABS}
        value={current}
        onChange={(next) => router.setParams({ tab: next })}
        accessibilityLabel="Admin sections"
      />
      <Animated.View key={current} entering={FadeIn.duration(220)} style={styles.panel}>
        <Panel />
      </Animated.View>
    </Page>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: space.xl,
  },
});
