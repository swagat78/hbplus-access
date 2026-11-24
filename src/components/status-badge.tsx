import { StyleSheet, View } from 'react-native';

import { colors, fonts, radius, space } from '@/theme';

import { AppText } from './app-text';

export function SuspendedBadge() {
  return (
    <View style={styles.badge}>
      <View style={styles.dot} />
      <AppText style={styles.text}>Suspended</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: space.sm + 2,
    paddingVertical: space.xxs + 1,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerTint,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.4,
    color: colors.danger,
  },
});
