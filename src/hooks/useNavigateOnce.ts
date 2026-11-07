import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Wraps a navigation call so a fast double tap opens the next screen only once. The lock
 * is released when this screen is focused again (e.g. the user comes back).
 */
export function useNavigateOnce() {
  const isNavigating = useRef(false);

  useFocusEffect(
    useCallback(() => {
      isNavigating.current = false;
    }, []),
  );

  return useCallback((navigate: () => void) => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    navigate();
  }, []);
}
