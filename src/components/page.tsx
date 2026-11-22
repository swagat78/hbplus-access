import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLayout } from '@/hooks/use-layout';
import { colors, layout, space } from '@/theme';

import { AppText } from './app-text';

type Props = {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
};

export function Page({ eyebrow, title, intro, children }: Props) {
  const { gutter, isWide } = useLayout();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.inner, { paddingHorizontal: gutter, paddingTop: isWide ? space.xxxl : space.xl }]}>
        <View style={styles.hero}>
          <AppText variant="eyebrow">{eyebrow}</AppText>
          <AppText variant={isWide ? 'display' : 'title'}>{title}</AppText>
          {intro ? (
            <AppText variant="body" color={colors.muted} style={styles.intro}>
              {intro}
            </AppText>
          ) : null}
        </View>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  inner: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    gap: space.xxl,
  },
  hero: {
    gap: space.sm,
  },
  intro: {
    maxWidth: 620,
  },
});
