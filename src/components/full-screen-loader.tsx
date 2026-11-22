import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

// Shown before fonts are ready, so it deliberately has no text.
export function FullScreenLoader() {
  return (
    <View style={styles.root} accessibilityLabel="Loading" accessibilityRole="progressbar">
      <ActivityIndicator color={colors.rust} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
});
