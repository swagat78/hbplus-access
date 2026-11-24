import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/auth-provider';
import { useShell } from '@/features/shell/shell-state';
import { colors, space } from '@/theme';

import { Avatar } from './avatar';
import { IconButton } from './icon-button';
import { Wordmark } from './wordmark';

// Top bar for phones and narrow windows. Navigation lives in the slide-in
// menu, same items as the sidebar on wide screens.
export function AppHeader() {
  const { profile } = useAuth();
  const { openDrawer } = useShell();
  const insets = useSafeAreaInsets();

  if (!profile) return null;

  return (
    <View style={[styles.bar, { paddingTop: insets.top + space.sm }]}>
      <IconButton icon="menu" label="Open menu" onPress={openDrawer} />
      <Wordmark size={20} />
      <View style={styles.spacer} />
      <Avatar name={profile.full_name} email={profile.email} uri={profile.avatar_url} size={32} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    backgroundColor: colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  spacer: {
    flex: 1,
  },
});
