import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { RoleBadge } from '@/components/role-badge';
import { timeAgo } from '@/lib/format';
import { colors, fonts, space } from '@/theme';
import type { AppRole, Profile } from '@/types/database';

type Props = {
  member: Profile;
  isSelf: boolean;
  compact: boolean;
  last: boolean;
  onChangeRole: (memberId: string, role: AppRole) => Promise<void>;
  onError: (message: string) => void;
};

export function MemberRow({ member, isSelf, compact, last, onChangeRole, onError }: Props) {
  const [saving, setSaving] = useState(false);
  const nextRole: AppRole = member.role === 'admin' ? 'user' : 'admin';

  const handlePress = async () => {
    setSaving(true);
    try {
      await onChangeRole(member.id, nextRole);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not update the role.');
    } finally {
      setSaving(false);
    }
  };

  const action = isSelf ? (
    <AppText variant="small" style={styles.self}>
      You
    </AppText>
  ) : (
    <Button
      size="sm"
      label={nextRole === 'admin' ? 'Make admin' : 'Remove admin'}
      accessibilityLabel={`${nextRole === 'admin' ? 'Make admin' : 'Remove admin'}: ${member.email}`}
      onPress={handlePress}
      loading={saving}
    />
  );

  return (
    <View style={[styles.row, !last && styles.divider]}>
      <Avatar name={member.full_name} email={member.email} uri={member.avatar_url} size={40} />

      <View style={styles.who}>
        <AppText style={styles.name} numberOfLines={1}>
          {member.full_name ?? member.email.split('@')[0]}
        </AppText>
        <AppText variant="small" numberOfLines={1}>
          {member.email}
        </AppText>
        {compact ? (
          <View style={styles.compactMeta}>
            <RoleBadge role={member.role} />
            <AppText variant="small">{timeAgo(member.last_sign_in_at)}</AppText>
          </View>
        ) : null}
      </View>

      {compact ? null : (
        <>
          <AppText variant="small" style={styles.seen}>
            {timeAgo(member.last_sign_in_at)}
          </AppText>
          <View style={styles.role}>
            <RoleBadge role={member.role} />
          </View>
        </>
      )}

      <View style={styles.action}>{action}</View>
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
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
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
    gap: space.sm,
    marginTop: space.xs,
  },
  seen: {
    width: 110,
  },
  role: {
    width: 80,
  },
  action: {
    minWidth: 112,
    alignItems: 'flex-end',
  },
  self: {
    paddingHorizontal: space.md,
  },
});
