import Feather from '@expo/vector-icons/Feather';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius } from '@/theme';

type Props = {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  tone?: 'onLight' | 'onDark';
  size?: number;
};

export function IconButton({ icon, label, onPress, tone = 'onLight', size = 36 }: Props) {
  const [hovered, setHovered] = useState(false);
  const dark = tone === 'onDark';

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size },
        dark ? styles.dark : styles.light,
        (hovered || pressed) && (dark ? styles.darkActive : styles.lightActive),
      ]}
    >
      <Feather name={icon} size={18} color={dark ? colors.cream : colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  light: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  lightActive: {
    backgroundColor: colors.sand,
  },
  dark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  darkActive: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
});
