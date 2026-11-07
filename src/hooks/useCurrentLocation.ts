import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  getCurrentCoordinates,
  getLocationPermission,
  getPlaceName,
  openAppSettings,
  requestLocationPermission,
  type Coordinates,
  type LocationPermission,
} from '@/services/location';
import { getErrorMessage } from '@/utils/errors';

export type LocationStatus = 'loading' | 'granted' | 'denied' | 'error';

type LocationState = {
  status: LocationStatus;
  coordinates: Coordinates | null;
  /** e.g. "Boroko"; null until found, or if it cannot be found. */
  placeName: string | null;
  canAskAgain: boolean;
  errorMessage: string | null;
};

const INITIAL_STATE: LocationState = {
  status: 'loading',
  coordinates: null,
  placeName: null,
  canAskAgain: true,
  errorMessage: null,
};

/** Asks for location permission once, then finds where the user is. */
export function useCurrentLocation() {
  const [state, setState] = useState<LocationState>(INITIAL_STATE);
  const isMounted = useRef(true);
  const statusRef = useRef<LocationStatus>('loading');
  useEffect(() => {
    statusRef.current = state.status;
  }, [state.status]);

  const locate = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', errorMessage: null }));

    let permission: LocationPermission;
    try {
      permission = await requestLocationPermission();
    } catch {
      permission = { granted: false, canAskAgain: false };
    }
    if (!isMounted.current) return;
    if (!permission.granted) {
      setState({ ...INITIAL_STATE, status: 'denied', canAskAgain: permission.canAskAgain });
      return;
    }

    try {
      const coordinates = await getCurrentCoordinates();
      if (!isMounted.current) return;
      setState({ ...INITIAL_STATE, status: 'granted', coordinates });
      // Looked up after the map is shown, so a slow geocoder never delays the screen.
      const placeName = await getPlaceName(coordinates);
      if (isMounted.current) setState((current) => ({ ...current, placeName }));
    } catch (error) {
      if (!isMounted.current) return;
      setState({ ...INITIAL_STATE, status: 'error', errorMessage: getErrorMessage(error) });
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void locate();

    // Users often allow location in Settings and come back. Check silently (no prompt), so
    // closing the permission dialog itself can never trigger a second prompt.
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState !== 'active' || statusRef.current !== 'denied') return;
      getLocationPermission()
        .then((permission) => {
          if (permission.granted) void locate();
        })
        .catch(() => undefined);
    });

    return () => {
      isMounted.current = false;
      subscription.remove();
    };
  }, [locate]);

  return { ...state, retry: locate, openSettings: openAppSettings };
}
