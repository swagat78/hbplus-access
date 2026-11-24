import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { ConfirmButton } from '@/components/confirm-button';
import { RoleBadge } from '@/components/role-badge';
import { SuspendedBadge } from '@/components/status-badge';
import { timeAgo } from '@/lib/format';
import { colors, fonts, space } from '@/theme';
import type { AppRole, MemberStatus, Profile } from '@/types/database';

type Props = {
  member: Profile;
  isSelf: boolean;
  compact: boolean;
  last: boolean;
  onChangeRole: (memberId: string, role: AppRole) => Promise<void>;
  onChangeStatus: (memberId: string, status: MemberStatus) => Promise<void>;
  onError: (message: string) => void;
};

export function MemberRow({ member, isSelf, compact, last, onChangeRole, onChangeStatus, onError }: Props) {
  const [savingRole, setSavingRole] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const suspended = member.status === 'suspended';
  const nextRole: AppRole = member.role === 'admin' ? 'user' : 'admin';
  const name = member.full_name ?? member.email.split('@')[0];

  const run = async (work: () => Promise<void>, setBusy: (busy: boolean) => void) => {
    setBusy(true);
    try {
      await work();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'That change didn’t go through.');
    } finally {
      setBusy(false);
    }
  };

  const badges = (
    <View style={styles.badges}>
      <RoleBadge role={member.role} />
      {suspended ? <SuspendedBadge /> : null}
    </View>
  );

  const actions = isSelf ? (
    <AppText variant="small" style={styles.self}>
      That&apos;s you
    </AppText>
  ) : (
    <View style={styles.actions}>
      <Button
        size="sm"
        label={nextRole === 'admin' ? 'Make admin' : 'Remove admin'}
        accessibilityLabel={`${nextRole === 'admin' ? 'Make admin' : 'Remove admin'}: ${member.email}`}
        loading={savingRole}
        onPress={() => run(() => onChangeRole(member.id, nextRole), setSavingRole)}
      />
      {suspended ? (
        <Button
          size="sm"
          label="Restore"
          accessibilityLabel={`Restore access: ${member.email}`}
          loading={savingStatus}
          onPress={() => run(() => onChangeStatus(member.id, 'active'), setSavingStatus)}
        />
      ) : (
        <ConfirmButton
          label="Suspend"
          confirmLabel="Confirm suspend"
          accessibilityLabel={`Suspend ${member.email}`}
          disabled={savingStatus}
          onConfirm={() => run(() => onChangeStatus(member.id, 'suspended'), setSavingStatus)}
        />
      )}
    </View>
  );

  return (
    <View style={[styles.row, compact && styles.rowCompact, !last && styles.divider]}>
      <View style={styles.identity}>
        <View style={suspended && styles.dimmed}>
          <Avatar name={member.full_name} email={member.email} uri={member.avatar_url} size={40} />
        </View>
        <View style={styles.who}>
          <AppText style={styles.name} numberOfLines={1}>
            {name}
          </AppText>
          <AppText variant="small" numberOfLines={1}>
            {member.email}
          </AppText>
          {compact ? (
            <View style={styles.compactMeta}>
              {badges}
              <AppText variant="small">· {timeAgo(member.last_sign_in_at)}</AppText>
            </View>
          ) : null}
        </View>
      </View>

      {compact ? null : (
        <>
          <AppText variant="small" style={styles.seen}>
            {timeAgo(member.last_sign_in_at)}
          </AppText>
          <View style={styles.badgeCol}>{badges}</View>
        </>
      )}

      {actions}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md + space.xxs,
  },
  rowCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  dimmed: {
    opacity: 0.45,
  },
  who: {
    flex: 1,
    gap: space.xxs,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.ink,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.xs,
  },
  seen: {
    width: 100,
  },
  badgeCol: {
    width: 150,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs + 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space.sm,
    minWidth: 232,
  },
  self: {
    minWidth: 232,
    textAlign: 'right',
    paddingHorizontal: space.md,
  },
});
