import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { ALLOWED_DOMAIN } from '@/lib/domain';
import { colors, fonts, space } from '@/theme';

const CHECKS = [
  {
    title: 'Google verified your identity',
    detail: 'OAuth 2.0 with PKCE. No password ever touches this app.',
  },
  {
    title: `Email domain is @${ALLOWED_DOMAIN}`,
    detail: 'Checked against the user returned by the auth server, not a cached token.',
  },
  {
    title: 'Account accepted at sign-up',
    detail: 'A Postgres hook and trigger refuse any other domain before the user is created.',
  },
  {
    title: 'Profile readable under RLS',
    detail: 'Row-level security only returns data to allowed-domain sessions.',
  },
];

export function AccessChecks() {
  return (
    <Card title="Why you're in" caption="Every sign-in passes these, in this order.">
      <View style={styles.list}>
        {CHECKS.map((check, index) => (
          <View key={check.title} style={styles.item}>
            <View style={styles.step}>
              <AppText style={styles.stepText}>{index + 1}</AppText>
            </View>
            <View style={styles.copy}>
              <AppText style={styles.title}>{check.title}</AppText>
              <AppText variant="small">{check.detail}</AppText>
            </View>
            <AppText style={styles.tick} accessibilityLabel="Passed">
              ✓
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: space.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  step: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 14,
    color: colors.inkSoft,
  },
  copy: {
    flex: 1,
    gap: space.xxs,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  tick: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.success,
  },
});
