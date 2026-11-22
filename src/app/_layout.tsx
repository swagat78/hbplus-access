import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { FullScreenLoader } from '@/components/full-screen-loader';
import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    DMSerifDisplay_400Regular,
  });

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator fontsLoaded={fontsLoaded} />
    </AuthProvider>
  );
}

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { status } = useAuth();
  const ready = fontsLoaded && status !== 'loading';

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // The navigator isn't mounted until we know whether there's a session.
  // Otherwise a cold load of /dashboard would bounce to /login and lose the
  // URL before the stored session had a chance to restore.
  if (!ready) return <FullScreenLoader />;

  const signedIn = status === 'signed-in';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.cream },
      }}
    >
      <Stack.Screen name="index" />

      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" options={{ title: 'Sign in · HB+' }} />
      </Stack.Protected>

      <Stack.Protected guard={signedIn} redirectTo="/login">
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
