import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { usePageTitle } from '@/hooks/use-page-title';
import { colors, space } from '@/theme';

export default function NotFound() {
  usePageTitle('Page not found · HB+');

  return (
    <View style={styles.root}>
      <AppText variant="eyebrow">404</AppText>
      <AppText variant="title" style={styles.center}>
        This page doesn&apos;t exist
      </AppText>
      <AppText variant="small" style={styles.center}>
        The link may be old, or the page may have moved.
      </AppText>
      <Button label="Go home" tone="primary" onPress={() => router.replace('/')} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.xl,
    backgroundColor: colors.cream,
  },
  center: {
    textAlign: 'center',
  },
  button: {
    marginTop: space.lg,
  },
});
