import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { MobileDrawer } from '@/components/mobile-drawer';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/features/auth/auth-provider';
import { ShellProvider } from '@/features/shell/shell-state';
import { useLayout } from '@/hooks/use-layout';
import { colors } from '@/theme';

export default function AppLayout() {
  return (
    <ShellProvider>
      <Shell />
    </ShellProvider>
  );
}

function Shell() {
  const { isAdmin } = useAuth();
  const { hasSidebar } = useLayout();

  return (
    <View style={[styles.root, hasSidebar && styles.row]}>
      {hasSidebar ? <Sidebar variant="rail" /> : <AppHeader />}

      <View style={styles.content}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: colors.cream },
          }}
        >
          <Stack.Screen name="dashboard" options={{ title: 'Overview · HB+' }} />

          {/* UI-level guard only. Every admin action is re-checked in Postgres. */}
          <Stack.Protected guard={isAdmin} redirectTo="/dashboard">
            <Stack.Screen name="admin" options={{ title: 'Admin · HB+' }} />
          </Stack.Protected>
        </Stack>
      </View>

      {hasSidebar ? null : <MobileDrawer />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  row: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
});
