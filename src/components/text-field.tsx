import Feather from '@expo/vector-icons/Feather';
import { useState, type ComponentProps } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { colors, fonts, radius, space } from '@/theme';

type Props = Omit<TextInputProps, 'style'> & {
  icon?: ComponentProps<typeof Feather>['name'];
  invalid?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function TextField({ icon, invalid, style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.box, focused && styles.focused, invalid && styles.invalid, style]}>
      {icon ? <Feather name={icon} size={16} color={focused ? colors.inkSoft : colors.faint} /> : null}
      <TextInput
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        placeholderTextColor={colors.faint}
        // The box draws its own focus ring, so the browser's inner one goes.
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 40,
    paddingHorizontal: space.md,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  focused: {
    borderColor: colors.rust,
  },
  invalid: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    outlineWidth: 0,
  },
});
