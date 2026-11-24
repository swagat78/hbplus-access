import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { colors, fonts, radius, space } from '@/theme';

export function AdminCallout() {
  return (
    <View style={styles.card}>
      <AppText variant="eyebrow" color="#E3A58C">
        Admin
      </AppText>
      <AppText style={styles.title}>Run the team space.</AppText>
      <AppText variant="small" color="rgba(244,242,240,0.7)">
        Promote or suspend members, decide which email domains can sign in, and read the full audit
        log. Every change is checked and recorded by the database.
      </AppText>
      <Button
        label="Open admin panel"
        tone="primary"
        onPress={() => router.navigate({ pathname: '/admin', params: { tab: 'overview' } })}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: space.xl,
    gap: space.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
    color: colors.cream,
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: space.md,
  },
});
