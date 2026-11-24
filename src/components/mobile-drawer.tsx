import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutLeft } from 'react-native-reanimated';

import { useShell } from '@/features/shell/shell-state';

import { Sidebar } from './sidebar';

export function MobileDrawer() {
  const { drawerOpen, closeDrawer } = useShell();

  useEffect(() => {
    if (!drawerOpen || Platform.OS !== 'web') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, closeDrawer]);

  // The wrapper stays mounted so the exit animations below can play.
  return (
    <View style={[styles.layer, !drawerOpen && styles.inert]}>
      {drawerOpen ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeDrawer}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          />
        </Animated.View>
      ) : null}
      {drawerOpen ? (
        <Animated.View
          entering={SlideInLeft.duration(260)}
          exiting={SlideOutLeft.duration(200)}
          style={styles.panel}
          accessibilityViewIsModal
        >
          <Sidebar variant="drawer" onNavigate={closeDrawer} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 50,
  },
  inert: {
    pointerEvents: 'none',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(18,18,21,0.45)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    maxWidth: '86%',
  },
});
