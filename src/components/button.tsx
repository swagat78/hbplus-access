import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius, space } from '@/theme';

import { AppText } from './app-text';

type Props = {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  tone = 'secondary',
  size = 'md',
  loading,
  disabled,
  accessibilityLabel,
  style,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const inactive = disabled || loading;
  const textColor = tone === 'primary' || tone === 'danger' ? colors.surface : colors.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.small,
        styles[tone],
        hovered && !inactive && hoverStyles[tone],
        pressed && pressedStyles[tone],
        inactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <AppText style={[styles.label, size === 'sm' && styles.labelSmall, { color: textColor }]}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 44,
    paddingHorizontal: space.lg + space.xs,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  small: {
    height: 34,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
  },
  primary: {
    backgroundColor: colors.rust,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.danger,
  },
  inactive: {
    opacity: 0.5,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  labelSmall: {
    fontSize: 13,
  },
});

const hoverStyles = StyleSheet.create({
  primary: { backgroundColor: colors.rustPressed },
  secondary: { borderColor: colors.faint },
  ghost: { backgroundColor: colors.sand },
  danger: { backgroundColor: colors.dangerPressed },
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.rustPressed },
  secondary: { backgroundColor: colors.sand },
  ghost: { backgroundColor: colors.line },
  danger: { backgroundColor: colors.dangerPressed },
});
