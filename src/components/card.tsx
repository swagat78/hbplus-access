import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, space } from '@/theme';

import { AppText } from './app-text';

type Props = {
  title?: string;
  caption?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ title, caption, children, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <View style={styles.header}>
          <AppText variant="heading">{title}</AppText>
          {caption ? <AppText variant="small">{caption}</AppText> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.xl,
    gap: space.lg,
  },
  header: {
    gap: space.xxs,
  },
});
