import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, radius, space } from '@/theme';

import { AppText } from './app-text';

type Props = {
  message: string;
  tone?: 'error' | 'info';
  onDismiss?: () => void;
};

export function Notice({ message, tone = 'error', onDismiss }: Props) {
  const isError = tone === 'error';

  return (
    <View
      accessibilityRole={isError ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      style={[styles.box, isError ? styles.error : styles.info]}
    >
      <View style={[styles.dot, { backgroundColor: isError ? colors.rust : colors.inkSoft }]}>
        <AppText style={styles.dotText}>{isError ? '!' : 'i'}</AppText>
      </View>
      <AppText variant="body" style={styles.message} color={isError ? colors.rustPressed : colors.inkSoft}>
        {message}
      </AppText>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss message"
          style={styles.close}
        >
          <AppText style={styles.closeText}>×</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    padding: space.md + space.xxs,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  error: {
    backgroundColor: colors.rustTint,
    borderColor: colors.rustBorder,
  },
  info: {
    backgroundColor: colors.mist,
    borderColor: '#D3E4E8',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  dotText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 14,
    color: colors.surface,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  close: {
    paddingHorizontal: space.xs,
  },
  closeText: {
    fontSize: 20,
    lineHeight: 22,
    color: colors.muted,
  },
});
