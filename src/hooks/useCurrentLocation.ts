import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  getCurrentCoordinates,
  getLocationPermission,
  getPlaceName,
  openAppSettings,
  requestLocationPermission,
  type Coordinates,
} from '@/services/location';
import { getErrorMessage } from '@/utils/errors';

export type LocationStatus = 'loading' | 'granted' | 'denied' | 'error';

type LocationState = {
  status: LocationStatus;
  coordinates: Coordinates | null;
  canAskAgain: boolean;
  errorMessage: string | null;
};

const LOADING_STATE: LocationState = {
  status: 'loading',
  coordinates: null,
  canAskAgain: true,
  errorMessage: null,
};

/** Asks for permission (prompting only if never answered) and then finds the phone. */
async function findLocation(): Promise<LocationState> {
  let permission;
  try {
    permission = await requestLocationPermission();
  } catch {
    return { ...LOADING_STATE, status: 'denied', canAskAgain: false };
  }
  if (!permission.granted) {
    return { ...LOADING_STATE, status: 'denied', canAskAgain: permission.canAskAgain };
  }

  try {
    const coordinates = await getCurrentCoordinates();
    return { ...LOADING_STATE, status: 'granted', coordinates };
  } catch (error) {
    return { ...LOADING_STATE, status: 'error', errorMessage: getErrorMessage(error) };
  }
}

/** The user's location, with the status a screen needs to explain what is happening. */
export function useCurrentLocation() {
  const [state, setState] = useState<LocationState>(LOADING_STATE);
  const [placeName, setPlaceName] = useState<string | null>(null);
  // Bumped to start a new lookup (retry, or permission granted in Settings).
  const [attempt, setAttempt] = useState(0);
  const statusRef = useRef<LocationStatus>('loading');

  useEffect(() => {
    statusRef.current = state.status;
  }, [state.status]);

  useEffect(() => {
    let isCurrent = true;
    findLocation().then((next) => {
      if (isCurrent) setState(next);
    });
    return () => {
      isCurrent = false;
    };
  }, [attempt]);

  // Looked up after the map is shown, so a slow geocoder never delays the screen.
  const { coordinates } = state;
  useEffect(() => {
    if (!coordinates) return;
    let isCurrent = true;
    getPlaceName(coordinates).then((name) => {
      if (isCurrent) setPlaceName(name);
    });
    return () => {
      isCurrent = false;
    };
  }, [coordinates]);

  const retry = useCallback(() => {
    setState(LOADING_STATE);
    setAttempt((count) => count + 1);
  }, []);

  // Users often allow location in Settings and come back. Check silently (no prompt), so
  // closing the permission dialog itself can never trigger a second prompt.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState !== 'active' || statusRef.current !== 'denied') return;
      getLocationPermission()
        .then((permission) => {
          if (permission.granted) retry();
        })
        .catch(() => undefined);
    });
    return () => subscription.remove();
  }, [retry]);

  return { ...state, placeName, retry, openSettings: openAppSettings };
}
