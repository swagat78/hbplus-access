import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

type Props = {
  delay?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// A small "rise into place" on first render. Reanimated skips it entirely
// when the OS asks for reduced motion.
export function Reveal({ delay = 0, children, style }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(420).delay(delay)} style={style}>
      {children}
    </Animated.View>
  );
}
