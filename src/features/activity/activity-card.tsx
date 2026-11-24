import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { timeAgo } from '@/lib/format';
import { colors, fonts, space } from '@/theme';
import type { AuthEventKind } from '@/types/database';

import { useActivity, type ActivityItem } from './use-activity';

type Props = {
  title: string;
  caption: string;
  currentUserId: string;
  limit?: number;
  kinds?: readonly AuthEventKind[];
  onLoadMore?: () => void;
};

export function ActivityCard({ title, caption, currentUserId, limit = 8, kinds, onLoadMore }: Props) {
  const { items, loading, failed, stale } = useActivity(limit, kinds);
  const mayHaveMore = Boolean(onLoadMore) && items.length >= limit;

  return (
    <Card title={title} caption={caption}>
      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color={colors.rust} />
        </View>
      ) : failed ? (
        <View style={styles.state}>
          <AppText variant="small">Couldn&apos;t load activity right now.</AppText>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.state}>
          <AppText variant="small">Nothing here yet. Entries show up as they happen.</AppText>
        </View>
      ) : (
        <View style={stale && styles.stale}>
          {items.map((item, index) => (
            <ActivityRow
              key={item.id}
              item={item}
              currentUserId={currentUserId}
              last={index === items.length - 1}
            />
          ))}
        </View>
      )}

      {mayHaveMore ? (
        <Button label="Load more" size="sm" onPress={() => onLoadMore?.()} loading={stale} style={styles.more} />
      ) : null}
    </Card>
  );
}

type Line = {
  person: ActivityItem['member'];
  who: string;
  text: string;
  icon: ComponentProps<typeof Feather>['name'];
  tone: string;
};

function displayName(person: ActivityItem['member']) {
  return person?.full_name || person?.email || null;
}

// Turns an event into "<who> <did what>", from the reader's point of view.
function describe(item: ActivityItem, currentUserId: string): Line {
  const subjectIsMe = item.user_id === currentUserId;
  const actorIsMe = item.actor_id === currentUserId;
  const subject = subjectIsMe ? 'You' : displayName(item.member) ?? 'A teammate';
  const actor = actorIsMe ? 'you' : displayName(item.actor) ?? 'an admin';
  const was = subjectIsMe ? 'were' : 'was';

  switch (item.kind) {
    case 'role_changed':
      return {
        person: item.member,
        who: subject,
        text:
          item.detail.to === 'admin'
            ? `${was} made an admin by ${actor}`
            : `${was} moved back to member by ${actor}`,
        icon: 'shield',
        tone: colors.rust,
      };
    case 'status_changed': {
      const suspended = item.detail.to === 'suspended';
      return {
        person: item.member,
        who: subject,
        text: suspended
          ? `${was} suspended by ${actor}`
          : `${subjectIsMe ? 'had your' : 'had their'} access restored by ${actor}`,
        icon: suspended ? 'pause' : 'play',
        tone: suspended ? colors.danger : colors.success,
      };
    }
    case 'domain_added':
    case 'domain_removed':
      return {
        person: item.actor,
        who: actorIsMe ? 'You' : displayName(item.actor) ?? 'An admin',
        text: `${item.kind === 'domain_added' ? 'allowed' : 'removed'} @${item.detail.domain ?? 'a domain'}`,
        icon: item.kind === 'domain_added' ? 'plus' : 'minus',
        tone: colors.inkSoft,
      };
    case 'signed_in':
    default:
      return {
        person: item.member,
        who: subject,
        text: 'signed in with Google',
        icon: 'log-in',
        tone: colors.success,
      };
  }
}

function ActivityRow({ item, currentUserId, last }: { item: ActivityItem; currentUserId: string; last: boolean }) {
  const line = describe(item, currentUserId);

  return (
    <View style={[styles.row, !last && styles.divider]}>
      <View>
        <Avatar
          name={line.person?.full_name ?? null}
          email={line.person?.email ?? '?'}
          uri={line.person?.avatar_url}
          size={36}
        />
        <View style={[styles.badge, { backgroundColor: line.tone }]}>
          <Feather name={line.icon} size={9} color={colors.surface} />
        </View>
      </View>
      <AppText style={styles.text} numberOfLines={2}>
        <AppText style={styles.name}>{line.who}</AppText> {line.text}
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
  stale: {
    opacity: 0.5,
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
  more: {
    alignSelf: 'center',
  },
});
