import Feather from '@expo/vector-icons/Feather';
import { router, useGlobalSearchParams, usePathname } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/auth-provider';
import { navSections, toAdminTab, type NavItem } from '@/features/shell/nav';
import { useShell } from '@/features/shell/shell-state';
import { colors, fonts, layout, radius, space } from '@/theme';

import { AppText } from './app-text';
import { Avatar } from './avatar';
import { IconButton } from './icon-button';
import { Wordmark } from './wordmark';

const MUTED = 'rgba(244,242,240,0.55)';

type Props = {
  // 'rail' sits beside the content on wide screens and can collapse.
  // 'drawer' is the slide-in menu on phones.
  variant: 'rail' | 'drawer';
  onNavigate?: () => void;
};

export function Sidebar({ variant, onNavigate }: Props) {
  const { profile, isAdmin, signOut } = useAuth();
  const { collapsed: railCollapsed, toggleCollapsed } = useShell();
  const pathname = usePathname();
  const { tab } = useGlobalSearchParams<{ tab?: string }>();
  const insets = useSafeAreaInsets();
  const [signingOut, setSigningOut] = useState(false);

  const collapsed = variant === 'rail' && railCollapsed;
  const currentTab = toAdminTab(tab);

  const railStyle = useAnimatedStyle(() => ({
    width: withTiming(collapsed ? layout.sidebarCollapsedWidth : layout.sidebarWidth, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    }),
  }));

  if (!profile) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const go = (item: NavItem) => {
    router.navigate(item.href);
    onNavigate?.();
  };

  return (
    <Animated.View
      style={[
        styles.sidebar,
        variant === 'rail' ? railStyle : styles.drawer,
        collapsed && styles.sidebarCollapsed,
        { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.lg },
      ]}
    >
      {/* Clipped separately so tooltips can stick out of the rail. */}
      <View style={styles.glowClip}>
        <View style={styles.glow} />
      </View>

      <View style={[styles.brand, collapsed && styles.brandCollapsed]}>
        <Wordmark size={collapsed ? 20 : 24} inverted caption={collapsed ? undefined : 'Team space'} />
        {variant === 'rail' ? (
          <IconButton
            icon={collapsed ? 'chevrons-right' : 'chevrons-left'}
            label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onPress={toggleCollapsed}
            tone="onDark"
            size={30}
          />
        ) : (
          <IconButton icon="x" label="Close menu" onPress={() => onNavigate?.()} tone="onDark" size={32} />
        )}
      </View>

      <View style={styles.sections}>
        {navSections(isAdmin).map((section) => (
          <View key={section.title} style={styles.group} accessibilityRole="menu">
            {collapsed ? (
              <View style={styles.groupRule} />
            ) : (
              <AppText style={styles.groupLabel}>{section.title}</AppText>
            )}
            {section.items.map((item) => (
              <SideLink
                key={item.key}
                item={item}
                collapsed={collapsed}
                active={item.isActive(pathname, currentTab)}
                onPress={() => go(item)}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.spacer} />

      <View style={[styles.user, collapsed && styles.userCollapsed]}>
        <View style={[styles.userRow, collapsed && styles.userRowCollapsed]}>
          <Avatar name={profile.full_name} email={profile.email} uri={profile.avatar_url} size={collapsed ? 34 : 38} />
          {collapsed ? null : (
            <Animated.View entering={FadeIn.delay(120).duration(180)} style={styles.userText}>
              <AppText style={styles.userName} numberOfLines={1}>
                {profile.full_name ?? profile.email.split('@')[0]}
              </AppText>
              <AppText style={styles.userEmail} numberOfLines={1}>
                {profile.email}
              </AppText>
            </Animated.View>
          )}
        </View>

        {collapsed ? (
          <IconButton icon="log-out" label="Sign out" onPress={handleSignOut} tone="onDark" size={34} />
        ) : (
          <View style={styles.userMeta}>
            <View style={[styles.rolePill, profile.role === 'admin' && styles.rolePillAdmin]}>
              <AppText style={styles.roleText}>{profile.role === 'admin' ? 'Admin' : 'Member'}</AppText>
            </View>
            <Pressable
              onPress={handleSignOut}
              disabled={signingOut}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}
            >
              {signingOut ? (
                <ActivityIndicator size="small" color={colors.cream} />
              ) : (
                <>
                  <Feather name="log-out" size={14} color={colors.cream} />
                  <AppText style={styles.signOutText}>Sign out</AppText>
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function SideLink({
  item,
  collapsed,
  active,
  onPress,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <View style={styles.linkWrap}>
      <Pressable
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        accessibilityRole="menuitem"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
        style={[
          styles.link,
          collapsed && styles.linkCollapsed,
          hovered && styles.linkHover,
          active && styles.linkActive,
        ]}
      >
        {active ? <View style={styles.activeBar} /> : null}
        <Feather name={item.icon} size={17} color={active ? colors.cream : MUTED} />
        {collapsed ? null : (
          <Animated.View entering={FadeIn.delay(100).duration(180)} style={styles.linkLabel}>
            <AppText style={[styles.linkText, active && styles.linkTextActive]} numberOfLines={1}>
              {item.label}
            </AppText>
          </Animated.View>
        )}
      </Pressable>

      {collapsed && hovered ? (
        <Animated.View entering={FadeIn.duration(120)} style={styles.tooltip}>
          <AppText style={styles.tooltipText} numberOfLines={1}>
            {item.label}
          </AppText>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: colors.ink,
    paddingHorizontal: space.lg,
    zIndex: 10,
  },
  sidebarCollapsed: {
    paddingHorizontal: space.md,
  },
  drawer: {
    width: 292,
    height: '100%',
  },
  glowClip: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  glow: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    top: -200,
    right: -170,
    backgroundColor: colors.rust,
    opacity: 0.3,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: space.sm,
    marginBottom: space.xxl,
    minHeight: 32,
  },
  brandCollapsed: {
    flexDirection: 'column',
    paddingLeft: 0,
    gap: space.lg,
  },
  sections: {
    gap: space.xl,
  },
  group: {
    gap: space.xs,
  },
  groupLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: 'rgba(244,242,240,0.38)',
    paddingHorizontal: space.md,
    marginBottom: space.sm,
  },
  groupRule: {
    height: 1,
    marginHorizontal: space.sm,
    marginBottom: space.sm,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  linkWrap: {
    position: 'relative',
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    height: 42,
    paddingHorizontal: space.md,
    borderRadius: radius.sm + 2,
    overflow: 'hidden',
  },
  linkCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  linkHover: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  linkActive: {
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 11,
    bottom: 11,
    width: 3,
    borderRadius: 2,
    backgroundColor: '#D9643A',
  },
  linkLabel: {
    flex: 1,
  },
  linkText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: MUTED,
  },
  linkTextActive: {
    color: colors.cream,
  },
  tooltip: {
    position: 'absolute',
    left: '100%',
    top: 7,
    marginLeft: space.md,
    paddingHorizontal: space.md - 2,
    paddingVertical: space.xs + 1,
    borderRadius: radius.sm,
    backgroundColor: colors.ink,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    zIndex: 20,
  },
  tooltipText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.cream,
  },
  spacer: {
    flex: 1,
    minHeight: space.xl,
  },
  user: {
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: space.md,
    gap: space.md,
  },
  userCollapsed: {
    alignItems: 'center',
    paddingHorizontal: space.xs,
    gap: space.sm,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  userRowCollapsed: {
    justifyContent: 'center',
  },
  userText: {
    flex: 1,
    gap: 1,
  },
  userName: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.cream,
  },
  userEmail: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: MUTED,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rolePill: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  rolePillAdmin: {
    backgroundColor: colors.rust,
  },
  roleText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.cream,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: space.sm + 2,
    borderRadius: radius.sm,
  },
  signOutPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  signOutText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.cream,
  },
});
