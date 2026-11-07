import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { subscribeToNetworkStatus } from './network';

// React Query cannot see a phone's connection or app state by itself. Telling it lets it
// pause requests while offline, refetch on reconnect, and refresh when the app reopens.
onlineManager.setEventListener((setOnline) => subscribeToNetworkStatus(setOnline));

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      // Jobs change slowly; this avoids refetching on every screen visit.
      staleTime: 60_000,
    },
  },
});
