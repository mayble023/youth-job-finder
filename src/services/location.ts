import * as Location from 'expo-location';
import { Linking } from 'react-native';

import { AppError } from '@/utils/errors';

export type Coordinates = { latitude: number; longitude: number };

export type LocationPermission = {
  granted: boolean;
  /** False once the user picked "Don't allow" too often; only Settings can change it then. */
  canAskAgain: boolean;
};

export type LocationErrorKind = 'services_disabled' | 'timeout' | 'unavailable';

const POSITION_TIMEOUT_MS = 10_000;
// A fix from the last few minutes is good enough to sort jobs by distance.
const LAST_KNOWN_MAX_AGE_MS = 5 * 60_000;

const MESSAGES: Record<LocationErrorKind, string> = {
  services_disabled: 'Location is turned off on your phone. Turn it on to see jobs near you.',
  timeout: 'Finding your location took too long. Move somewhere with a clearer sky and retry.',
  unavailable: 'We could not find your location right now. Please try again.',
};

function locationError(kind: LocationErrorKind) {
  return new AppError<LocationErrorKind>(kind, MESSAGES[kind]);
}

function toPermission(response: Location.LocationPermissionResponse): LocationPermission {
  return { granted: response.granted, canAskAgain: response.canAskAgain };
}

/** Reads the current permission without showing any prompt. */
export async function getLocationPermission(): Promise<LocationPermission> {
  return toPermission(await Location.getForegroundPermissionsAsync());
}

/** Shows the system prompt only if the user has not answered it yet. */
export async function requestLocationPermission(): Promise<LocationPermission> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted || !current.canAskAgain) return toPermission(current);
  return toPermission(await Location.requestForegroundPermissionsAsync());
}

/** The phone's position, giving up after 10 seconds. Call only after permission is granted. */
export async function getCurrentCoordinates(): Promise<Coordinates> {
  if (!(await Location.hasServicesEnabledAsync())) throw locationError('services_disabled');

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), POSITION_TIMEOUT_MS);
  });

  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      timeout,
    ]);
    if (position) return position.coords;

    // GPS can be slow indoors; a recent cached fix is better than nothing.
    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: LAST_KNOWN_MAX_AGE_MS,
    });
    if (lastKnown) return lastKnown.coords;
    throw locationError('timeout');
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw locationError('unavailable');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * A short place name such as "Boroko" or "Lae". Returns null when it cannot be found
 * (e.g. offline, since the phone's geocoder needs the internet) — it is only a nice-to-have.
 */
export async function getPlaceName(coordinates: Coordinates): Promise<string | null> {
  try {
    const [address] = await Location.reverseGeocodeAsync(coordinates);
    if (!address) return null;
    return address.district ?? address.city ?? address.subregion ?? address.region ?? null;
  } catch {
    return null;
  }
}

/** Opens this app's page in the phone's Settings so the user can allow location. */
export async function openAppSettings(): Promise<void> {
  await Linking.openSettings();
}

/**
 * The phone's last known position, only if location is already allowed. Never shows a
 * permission prompt, so screens that merely benefit from location (recommendations) can
 * use it without interrupting the user.
 */
export async function getKnownCoordinatesWithoutPrompt(): Promise<Coordinates | null> {
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) return null;
    const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS });
    return lastKnown?.coords ?? null;
  } catch {
    return null;
  }
}
