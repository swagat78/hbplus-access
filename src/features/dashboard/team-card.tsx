import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { Card } from '@/components/card';
import { timeAgo } from '@/lib/format';
import { colors, fonts, space } from '@/theme';
import type { TeamOverview } from '@/types/database';

type Props = {
  overview: TeamOverview | null;
  failed: boolean;
  currentUserId: string;
};

export function TeamCard({ overview, failed, currentUserId }: Props) {
  const people = overview?.recent ?? [];

  return (
    <Card title="Who's around" caption="The people on the team who signed in most recently.">
      {overview === null ? (
        <View style={styles.state}>
          {failed ? (
            <AppText variant="small">The team list isn&apos;t available yet.</AppText>
          ) : (
            <ActivityIndicator color={colors.rust} />
          )}
        </View>
      ) : (
        <>
          <View style={styles.stackRow}>
            <View style={styles.stack}>
              {people.slice(0, 5).map((person, i) => (
                <View key={person.id} style={[styles.stacked, { marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i }]}>
                  <Avatar name={person.name} email={person.name} uri={person.avatar_url} size={34} />
                </View>
              ))}
            </View>
            <AppText variant="small" style={styles.stackText}>
              <AppText style={styles.strong}>{overview.active_week}</AppText> active this week ·{' '}
              <AppText style={styles.strong}>{overview.members}</AppText> on the team
            </AppText>
          </View>

          <View>
            {people.map((person, index) => (
              <View key={person.id} style={[styles.row, index < people.length - 1 && styles.divider]}>
                <Avatar name={person.name} email={person.name} uri={person.avatar_url} size={30} />
                <AppText style={styles.name} numberOfLines={1}>
                  {person.id === currentUserId ? `${person.name} (you)` : person.name}
                </AppText>
                <AppText variant="small">{timeAgo(person.last_sign_in_at)}</AppText>
              </View>
            ))}
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  state: {
    paddingVertical: space.lg,
    alignItems: 'center',
  },
  stackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  stack: {
    flexDirection: 'row',
  },
  stacked: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  stackText: {
    flex: 1,
  },
  strong: {
    fontFamily: fonts.semibold,
    color: colors.ink,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm + 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
  },
  name: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.ink,
  },
});
