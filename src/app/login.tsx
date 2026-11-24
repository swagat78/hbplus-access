import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { GoogleButton } from '@/components/google-button';
import { Notice } from '@/components/notice';
import { useAuth } from '@/features/auth/auth-provider';
import { BrandPanel } from '@/features/auth/brand-panel';
import { useLayout } from '@/hooks/use-layout';
import { ALLOWED_DOMAIN } from '@/lib/domain';
import { env } from '@/lib/env';
import { colors, fonts, radius, space } from '@/theme';

export default function LoginScreen() {
  const { status, isSigningIn, error, signIn, clearError } = useAuth();
  const { isWide, gutter } = useLayout();
  const insets = useSafeAreaInsets();

  const verifying = status === 'verifying';
  const loadingLabel = verifying
    ? 'Checking your account…'
    : Platform.OS === 'web'
      ? 'Redirecting to Google…'
      : 'Waiting for Google…';

  const form = (
    <Animated.View
      entering={FadeInDown.duration(550).delay(200)}
      style={[styles.form, !isWide && styles.formCard]}
    >
      <View style={styles.heading}>
        <AppText variant="eyebrow">Sign in</AppText>
        <AppText variant="title">Welcome back</AppText>
        <AppText variant="body" color={colors.muted}>
          Use your <AppText style={styles.strong}>@{ALLOWED_DOMAIN}</AppText> Google account. Personal
          Gmail and other domains can&apos;t access this workspace.
        </AppText>
      </View>

      {!env.isConfigured ? (
        <Notice
          tone="info"
          message="Supabase isn't configured yet. Copy .env.example to .env, add your project URL and key, then restart the dev server."
        />
      ) : null}

      {error ? (
        <Animated.View entering={FadeIn.duration(220)}>
          <Notice message={error} onDismiss={clearError} />
        </Animated.View>
      ) : null}

      <GoogleButton
        onPress={signIn}
        loading={isSigningIn || verifying}
        loadingLabel={loadingLabel}
        disabled={!env.isConfigured}
      />

      <View style={styles.divider} />

      <View style={styles.facts}>
        <Fact icon="at-sign" text={`Only @${ALLOWED_DOMAIN} Google accounts get in`} />
        <Fact icon="lock" text="Signed in through Google with OAuth 2.0 and PKCE" />
        <Fact icon="server" text="Checked again on our servers, not just in this app" />
      </View>

      <AppText variant="small">Trouble getting in? Ask your HB+ admin.</AppText>
    </Animated.View>
  );

  if (isWide) {
    return (
      <View style={styles.split}>
        <BrandPanel />
        <ScrollView style={styles.side} contentContainerStyle={styles.sideContent}>
          {form}
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.side}
      contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}
      keyboardShouldPersistTaps="handled"
    >
      <BrandPanel compact topInset={insets.top} />
      <View style={[styles.overlap, { paddingHorizontal: gutter }]}>{form}</View>
    </ScrollView>
  );
}

function Fact({ icon, text }: { icon: ComponentProps<typeof Feather>['name']; text: string }) {
  return (
    <View style={styles.fact}>
      <View style={styles.factIcon}>
        <Feather name={icon} size={13} color={colors.rust} />
      </View>
      <AppText variant="small" style={styles.factText}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  split: {
    flex: 1,
    flexDirection: 'row',
  },
  side: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  sideContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xxxl,
  },
  overlap: {
    marginTop: -space.xxxl,
  },
  form: {
    width: '100%',
    maxWidth: 420,
    gap: space.xl,
  },
  formCard: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.xl,
  },
  heading: {
    gap: space.sm,
  },
  strong: {
    color: colors.ink,
    fontFamily: fonts.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
  },
  facts: {
    gap: space.md,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  factIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.rustTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factText: {
    flex: 1,
    color: colors.inkSoft,
  },
});
