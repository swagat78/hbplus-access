import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  size: number;
  color: string;
  opacity: number;
  style?: StyleProp<ViewStyle>;
  // How far it wanders, in px.
  drift?: number;
  duration?: number;
  delay?: number;
};

// Slow background glow. Purely decorative; with reduced motion turned on in
// the OS, Reanimated leaves it still.
export function FloatingOrb({ size, color, opacity, style, drift = 16, duration = 9000, delay = 0 }: Props) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.set(
      withDelay(
        delay,
        withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
      ),
    );
    return () => cancelAnimation(t);
  }, [t, duration, delay]);

  const animated = useAnimatedStyle(() => {
    const v = t.get();
    return {
      transform: [
        { translateX: (v - 0.5) * 2 * drift },
        { translateY: (0.5 - v) * drift },
        { scale: 1 + v * 0.06 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          pointerEvents: 'none',
        },
        style,
        animated,
      ]}
    />
  );
}
