import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fonts } from '@/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'small' | 'eyebrow' | 'label';

type Props = TextProps & {
  variant?: Variant;
  color?: string;
};

export function AppText({ variant = 'body', color, style, ...rest }: Props) {
  return <Text {...rest} style={[styles[variant], color ? { color } : null, style]} />;
}

const styles = StyleSheet.create({
  display: {
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
  },
  heading: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
  },
  small: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkSoft,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.rust,
  },
});
