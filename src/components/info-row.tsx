import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, fonts, space } from '@/theme';

import { AppText } from './app-text';

type Props = {
  label: string;
  value: ReactNode;
  last?: boolean;
};

export function InfoRow({ label, value, last }: Props) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <AppText variant="small">{label}</AppText>
      {typeof value === 'string' ? (
        <AppText style={styles.value} numberOfLines={1}>
          {value}
        </AppText>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
    paddingVertical: space.md,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
});
