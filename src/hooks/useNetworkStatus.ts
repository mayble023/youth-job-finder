import { useEffect, useState } from 'react';

import { subscribeToNetworkStatus } from '@/services/network';

/** True while the device has a working internet connection. */
export function useNetworkStatus(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => subscribeToNetworkStatus(setIsOnline), []);

  return { isOnline };
}
