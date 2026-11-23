import { StyleSheet } from 'react-native';

import { colors, fonts } from '@/theme';

import { AppText } from './app-text';

type Props = {
  size?: number;
  inverted?: boolean;
  caption?: string;
};

export function Wordmark({ size = 24, inverted, caption }: Props) {
  return (
    <AppText
      accessibilityRole="header"
      style={[styles.mark, { fontSize: size, lineHeight: size * 1.15 }]}
      color={inverted ? colors.cream : colors.ink}
    >
      HB
      <AppText style={[styles.mark, { fontSize: size, color: inverted ? '#D9643A' : colors.rust }]}>
        +
      </AppText>
      {caption ? (
        <AppText
          style={[styles.caption, { fontSize: size * 0.5 }]}
          color={inverted ? 'rgba(244,242,240,0.6)' : colors.muted}
        >
          {'  '}
          {caption}
        </AppText>
      ) : null}
    </AppText>
  );
}

const styles = StyleSheet.create({
  mark: {
    fontFamily: fonts.display,
  },
  caption: {
    fontFamily: fonts.medium,
    letterSpacing: 0.2,
  },
});
