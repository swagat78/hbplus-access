import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

type ShellState = {
  // Wide screens: sidebar shrunk to an icon rail.
  collapsed: boolean;
  toggleCollapsed: () => void;
  // Narrow screens: the slide-in menu.
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const noop = () => undefined;

const ShellContext = createContext<ShellState>({
  collapsed: false,
  toggleCollapsed: noop,
  drawerOpen: false,
  openDrawer: noop,
  closeDrawer: noop,
});

const STORAGE_KEY = 'hbplus.sidebar.collapsed';

// A per-browser convenience only. Storage can be missing or blocked
// (private windows, previews), so every access is guarded.
function readCollapsed() {
  if (Platform.OS !== 'web') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function ShellProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      // not worth surfacing
    }
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo(
    () => ({ collapsed, toggleCollapsed, drawerOpen, openDrawer, closeDrawer }),
    [collapsed, toggleCollapsed, drawerOpen, openDrawer, closeDrawer],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  return useContext(ShellContext);
}
