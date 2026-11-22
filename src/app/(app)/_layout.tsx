import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/features/auth/auth-provider';
import { colors } from '@/theme';

export default function AppLayout() {
  const { isAdmin } = useAuth();

  return (
    <View style={styles.root}>
      <AppHeader />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="dashboard" options={{ title: 'Overview · HB+' }} />

        {/* UI-level guard only. The real check is RLS + set_member_role() in Postgres. */}
        <Stack.Protected guard={isAdmin} redirectTo="/dashboard">
          <Stack.Screen name="team" options={{ title: 'Team · HB+' }} />
        </Stack.Protected>
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
});
