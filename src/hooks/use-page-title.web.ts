import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

// Browser tab title for the focused screen. It runs on focus rather than on
// mount, so the title comes back when you return to a screen that stayed
// mounted underneath another one.
export function usePageTitle(title: string) {
  useFocusEffect(
    useCallback(() => {
      document.title = title;
    }, [title]),
  );
}
