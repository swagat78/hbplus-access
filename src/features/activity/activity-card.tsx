import Feather from '@expo/vector-icons/Feather';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { Card } from '@/components/card';
import { timeAgo } from '@/lib/format';
import { colors, fonts, space } from '@/theme';

import { useActivity, type ActivityItem } from './use-activity';

type Props = {
  title: string;
  caption: string;
  currentUserId: string;
  limit?: number;
};

export function ActivityCard({ title, caption, currentUserId, limit = 8 }: Props) {
  const { items, loading, error } = useActivity(limit);

  return (
    <Card title={title} caption={caption}>
      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color={colors.rust} />
        </View>
      ) : error ? (
        <View style={styles.state}>
          <AppText variant="small">{error}</AppText>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.state}>
          <AppText variant="small">Nothing here yet. Sign-ins and role changes will show up as they happen.</AppText>
        </View>
      ) : (
        <View>
          {items.map((item, index) => (
            <ActivityRow
              key={item.id}
              item={item}
              isSelf={item.user_id === currentUserId}
              last={index === items.length - 1}
            />
          ))}
        </View>
      )}
    </Card>
  );
}

function ActivityRow({ item, isSelf, last }: { item: ActivityItem; isSelf: boolean; last: boolean }) {
  const name = isSelf ? 'You' : item.member?.full_name || item.member?.email || 'A teammate';
  const signedIn = item.kind === 'signed_in';
  const promoted = item.detail.to === 'admin';
  const actor = item.actor?.full_name || item.actor?.email || 'an admin';

  const sentence = signedIn
    ? 'signed in with Google'
    : promoted
      ? `${isSelf ? 'were' : 'was'} made an admin by ${actor}`
      : `${isSelf ? 'were' : 'was'} moved to member by ${actor}`;

  return (
    <View style={[styles.row, !last && styles.divider]}>
      <View>
        <Avatar
          name={item.member?.full_name ?? null}
          email={item.member?.email ?? '?'}
          uri={item.member?.avatar_url}
          size={36}
        />
        <View style={[styles.badge, signedIn ? styles.badgeSignIn : styles.badgeRole]}>
          <Feather name={signedIn ? 'log-in' : 'shield'} size={9} color={colors.surface} />
        </View>
      </View>
      <AppText style={styles.text} numberOfLines={2}>
        <AppText style={styles.name}>{name}</AppText> {sentence}
      </AppText>
      <AppText variant="small" style={styles.time}>
        {timeAgo(item.created_at)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    paddingVertical: space.xl,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
  },
  badge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSignIn: {
    backgroundColor: colors.success,
  },
  badgeRole: {
    backgroundColor: colors.rust,
  },
  text: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkSoft,
  },
  name: {
    fontFamily: fonts.semibold,
    color: colors.ink,
  },
  time: {
    fontSize: 12,
  },
});
