import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

/**
 * `isInternetReachable` is null while NetInfo is still checking; treat "unknown" as online
 * so the app does not flash an offline banner on every launch.
 */
function isOnline(state: NetInfoState): boolean {
  return state.isConnected !== false && state.isInternetReachable !== false;
}

/** Calls `listener` whenever connectivity changes. Returns an unsubscribe function. */
export function subscribeToNetworkStatus(listener: (online: boolean) => void): () => void {
  return NetInfo.addEventListener((state) => listener(isOnline(state)));
}
