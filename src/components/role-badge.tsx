import { StyleSheet, View } from 'react-native';

import { colors, fonts, radius, space } from '@/theme';
import type { AppRole } from '@/types/database';

import { AppText } from './app-text';

export function RoleBadge({ role }: { role: AppRole }) {
  const admin = role === 'admin';

  return (
    <View style={[styles.badge, admin ? styles.admin : styles.user]}>
      <AppText style={[styles.text, { color: admin ? colors.surface : colors.inkSoft }]}>
        {admin ? 'Admin' : 'Member'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.sm + space.xxs,
    paddingVertical: space.xxs + 1,
    borderRadius: radius.pill,
  },
  admin: {
    backgroundColor: colors.ink,
  },
  user: {
    backgroundColor: colors.sand,
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.4,
  },
});
