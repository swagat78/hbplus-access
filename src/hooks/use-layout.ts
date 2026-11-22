import { useWindowDimensions } from 'react-native';

import { layout } from '@/theme';

export function useLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= layout.wideBreakpoint;

  return {
    width,
    isWide,
    gutter: width < 600 ? 16 : 32,
  };
}
