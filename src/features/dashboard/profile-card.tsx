import { Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { Card } from '@/components/card';
import { InfoRow } from '@/components/info-row';
import { RoleBadge } from '@/components/role-badge';
import { getEmailDomain } from '@/lib/domain';
import { formatDate, timeAgo } from '@/lib/format';
import { colors, fonts, radius, space } from '@/theme';
import type { Profile } from '@/types/database';

const TOKEN_STORAGE = Platform.OS === 'web' ? 'Browser storage' : 'Keychain / Keystore';

export function ProfileCard({ profile, now }: { profile: Profile; now: number }) {
  return (
    <Card>
      <View style={styles.identity}>
        <Avatar name={profile.full_name} email={profile.email} uri={profile.avatar_url} size={52} />
        <View style={styles.text}>
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
        <InfoRow
          label="Domain"
          value={
            <View style={styles.verified}>
              <AppText style={styles.verifiedText}>@{getEmailDomain(profile.email)} · verified</AppText>
            </View>
          }
        />
        <InfoRow label="Member since" value={formatDate(profile.created_at)} />
        <InfoRow label="Last sign-in" value={timeAgo(profile.last_sign_in_at, now)} />
        <InfoRow label="Token stored in" value={TOKEN_STORAGE} last />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md + space.xxs,
  },
  text: {
    flex: 1,
    gap: space.xxs,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 21,
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
});
