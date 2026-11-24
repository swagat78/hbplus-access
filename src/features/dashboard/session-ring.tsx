import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/theme';

type Props = {
  // 0..1 of the token's lifetime that's left.
  fraction: number;
  size?: number;
};

// A meter, not a chart: the fill is the time left, the track is a lighter
// step of the same hue.
export function SessionRing({ fraction, size = 40 }: Props) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, fraction));

  // Decorative: the tile already says how many minutes are left. The hiding
  // lives on a View because react-native-svg hands its props straight to the
  // DOM on web, where accessibilityElementsHidden isn't a real attribute.
  return (
    <View aria-hidden>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.rustTint} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.rust}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}
