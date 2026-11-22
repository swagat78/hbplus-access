import { router, usePathname, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/auth-provider';
import { useLayout } from '@/hooks/use-layout';
import { colors, fonts, layout, radius, space } from '@/theme';

import { AppText } from './app-text';
import { Avatar } from './avatar';
import { Button } from './button';
import { Wordmark } from './wordmark';

type NavItem = { href: Href; path: string; label: string };

export function AppHeader() {
  const { profile, isAdmin, signOut } = useAuth();
  const { isWide, gutter } = useLayout();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  if (!profile) return null;

  const nav: NavItem[] = [{ href: '/dashboard', path: '/dashboard', label: 'Overview' }];
  if (isAdmin) nav.push({ href: '/team', path: '/team', label: 'Team' });

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const links =
    nav.length > 1 ? (
      <View style={styles.nav} accessibilityRole="tablist">
        {nav.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            active={pathname === item.path}
            onPress={() => router.navigate(item.href)}
          />
        ))}
      </View>
    ) : null;

  return (
    <View style={[styles.bar, { paddingTop: insets.top }]}>
      <View style={[styles.inner, { paddingHorizontal: gutter }]}>
        <View style={styles.row}>
          <View style={styles.left}>
            <Wordmark size={22} caption={isWide ? 'Team space' : undefined} />
            {isWide ? links : null}
          </View>

          <View style={styles.right}>
            {isWide ? (
              <View style={styles.identity}>
                <AppText style={styles.name} numberOfLines={1}>
                  {profile.full_name ?? profile.email}
                </AppText>
                <AppText variant="small" numberOfLines={1}>
                  {profile.email}
                </AppText>
              </View>
            ) : null}
            <Avatar name={profile.full_name} email={profile.email} uri={profile.avatar_url} size={34} />
            <Button label="Sign out" size="sm" onPress={handleSignOut} loading={signingOut} />
          </View>
        </View>

        {!isWide && links ? <View style={styles.mobileNav}>{links}</View> : null}
      </View>
    </View>
  );
}

function NavLink({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.link, active && styles.linkActive, pressed && styles.linkPressed]}
    >
      <AppText style={[styles.linkText, active && styles.linkTextActive]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  inner: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    paddingVertical: space.md,
    gap: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xxl,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  identity: {
    alignItems: 'flex-end',
    maxWidth: 240,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.ink,
  },
  nav: {
    flexDirection: 'row',
    gap: space.xs,
  },
  mobileNav: {
    marginBottom: -space.xs,
  },
  link: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm - 2,
    borderRadius: radius.pill,
  },
  linkActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  linkPressed: {
    backgroundColor: colors.sand,
  },
  linkText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.muted,
  },
  linkTextActive: {
    color: colors.ink,
  },
});
