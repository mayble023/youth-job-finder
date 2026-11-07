type Point = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Straight-line ("as the crow flies") distance in km using the haversine formula, which
 * treats the Earth as a sphere. Road distance in PNG is often much longer.
 */
export function haversineKm(from: Point, to: Point): number {
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(deltaLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** "850 m", "3.2 km" or "45 km". */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** Narrows a nullable lat/lng pair (as stored on jobs) to a point. */
export function toPoint(latitude: number | null, longitude: number | null): Point | null {
  return latitude === null || longitude === null ? null : { latitude, longitude };
}
