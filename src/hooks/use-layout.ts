import { useWindowDimensions } from 'react-native';

import { useShell } from '@/features/shell/shell-state';
import { layout } from '@/theme';

export function useLayout() {
  const { width } = useWindowDimensions();
  const { collapsed } = useShell();

  const isWide = width >= layout.wideBreakpoint;
  const hasSidebar = width >= layout.sidebarBreakpoint;
  const sidebarWidth = hasSidebar ? (collapsed ? layout.sidebarCollapsedWidth : layout.sidebarWidth) : 0;

  return {
    width,
    isWide,
    hasSidebar,
    contentWidth: width - sidebarWidth,
    gutter: width < 600 ? 16 : hasSidebar ? 40 : 32,
  };
}
