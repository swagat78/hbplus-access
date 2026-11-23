import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLayout } from '@/hooks/use-layout';
import { colors, layout, space } from '@/theme';

import { AppText } from './app-text';

type Props = {
  eyebrow?: string;
  title?: string;
  intro?: ReactNode;
  children: ReactNode;
};

export function Page({ eyebrow, title, intro, children }: Props) {
  const { gutter, isWide, hasSidebar } = useLayout();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={[
          styles.inner,
          {
            paddingHorizontal: gutter,
            paddingTop: hasSidebar ? space.xxl + space.sm : isWide ? space.xxl : space.xl,
          },
        ]}
      >
        {title ? (
          <View style={styles.hero}>
            {eyebrow ? <AppText variant="eyebrow">{eyebrow}</AppText> : null}
            <AppText variant={isWide ? 'display' : 'title'}>{title}</AppText>
            {intro ? (
              <AppText variant="body" color={colors.muted} style={styles.intro}>
                {intro}
              </AppText>
            ) : null}
          </View>
        ) : null}
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
    gap: space.xl,
  },
  hero: {
    gap: space.sm,
    marginBottom: space.sm,
  },
  intro: {
    maxWidth: 620,
  },
});
