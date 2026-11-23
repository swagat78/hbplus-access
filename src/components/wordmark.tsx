import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { colors, fonts } from '@/theme';

import { AppText } from './app-text';

// Official HB+ mark from hbplus.fit, cropped to its bounds.
const LOGO = require('@/assets/images/hbplus-logo.png');
const LOGO_WHITE = require('@/assets/images/hbplus-logo-white.png');
const LOGO_ASPECT = 1021 / 538;

type Props = {
  size?: number;
  inverted?: boolean;
  caption?: string;
};

export function Wordmark({ size = 24, inverted, caption }: Props) {
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel={caption ? `HB+ ${caption}` : 'HB+'}>
      <Image
        source={inverted ? LOGO_WHITE : LOGO}
        style={{ height: size, width: size * LOGO_ASPECT }}
        contentFit="contain"
        accessible={false}
      />
      {caption ? (
        <AppText
          style={[styles.caption, { fontSize: Math.max(12, size * 0.5) }]}
          color={inverted ? 'rgba(244,242,240,0.6)' : colors.muted}
        >
          {caption}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  caption: {
    fontFamily: fonts.medium,
    letterSpacing: 0.2,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(128,128,128,0.35)',
  },
});
