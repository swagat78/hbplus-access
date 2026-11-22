import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, fonts } from '@/theme';

import { AppText } from './app-text';

type Props = {
  name: string | null;
  email: string;
  uri?: string | null;
  size?: number;
};

export function Avatar({ name, email, uri, size = 40 }: Props) {
  // Google photo URLs occasionally 403 (rate limits, referrer rules), so
  // initials are always ready as a fallback.
  const [failed, setFailed] = useState(false);
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, shape]}
        onError={() => setFailed(true)}
        accessibilityIgnoresInvertColors
        accessible={false}
      />
    );
  }

  return (
    <View style={[styles.fallback, shape]}>
      <AppText style={[styles.initials, { fontSize: size * 0.38 }]}>{initials(name, email)}</AppText>
    </View>
  );
}

function initials(name: string | null, email: string) {
  const source = name?.trim() || email.split('@')[0];
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.sand,
  },
  fallback: {
    backgroundColor: colors.rustTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.semibold,
    color: colors.rust,
  },
});
