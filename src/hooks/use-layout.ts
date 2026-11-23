import { useWindowDimensions } from 'react-native';

import { layout } from '@/theme';

export function useLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= layout.wideBreakpoint;
  const hasSidebar = width >= layout.sidebarBreakpoint;
  const contentWidth = hasSidebar ? width - layout.sidebarWidth : width;

  return {
    width,
    isWide,
    hasSidebar,
    contentWidth,
    gutter: width < 600 ? 16 : hasSidebar ? 40 : 32,
  };
}
