import Feather from '@expo/vector-icons/Feather';
import { router, usePathname, type Href } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/auth-provider';
import { colors, fonts, layout, radius, space } from '@/theme';

import { AppText } from './app-text';
import { Avatar } from './avatar';
import { Wordmark } from './wordmark';

type IconName = ComponentProps<typeof Feather>['name'];

const MUTED = 'rgba(244,242,240,0.55)';

export function Sidebar() {
  const { profile, isAdmin, signOut } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [signingOut, setSigningOut] = useState(false);

  if (!profile) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <View style={[styles.sidebar, { paddingTop: insets.top + space.xl }]}>
      <View pointerEvents="none" style={styles.glow} />

      <View style={styles.brand}>
        <Wordmark size={26} inverted caption="Team space" />
      </View>

      <View style={styles.group} accessibilityRole="menu">
        <AppText style={styles.groupLabel}>Workspace</AppText>
        <SideLink icon="grid" label="Overview" href="/dashboard" active={pathname === '/dashboard'} />
        {isAdmin ? (
          <SideLink icon="users" label="Team & roles" href="/team" active={pathname === '/team'} />
        ) : null}
      </View>

      <View style={styles.spacer} />

      <View style={styles.user}>
        <View style={styles.userRow}>
          <Avatar name={profile.full_name} email={profile.email} uri={profile.avatar_url} size={38} />
          <View style={styles.userText}>
            <AppText style={styles.userName} numberOfLines={1}>
              {profile.full_name ?? profile.email.split('@')[0]}
            </AppText>
            <AppText style={styles.userEmail} numberOfLines={1}>
              {profile.email}
            </AppText>
          </View>
        </View>
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
      </View>
    </View>
  );
}

function SideLink({ icon, label, href, active }: { icon: IconName; label: string; href: Href; active: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={() => router.navigate(href)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="menuitem"
      accessibilityState={{ selected: active }}
      style={[styles.link, hovered && styles.linkHover, active && styles.linkActive]}
    >
      {active ? <View style={styles.activeBar} /> : null}
      <Feather name={icon} size={17} color={active ? colors.cream : MUTED} />
      <AppText style={[styles.linkText, active && styles.linkTextActive]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: layout.sidebarWidth,
    backgroundColor: colors.ink,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    overflow: 'hidden',
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
    paddingHorizontal: space.sm,
    marginBottom: space.xxl + space.sm,
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
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    height: 42,
    paddingHorizontal: space.md,
    borderRadius: radius.sm + 2,
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
  linkText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: MUTED,
  },
  linkTextActive: {
    color: colors.cream,
  },
  spacer: {
    flex: 1,
  },
  user: {
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: space.md,
    gap: space.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
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
