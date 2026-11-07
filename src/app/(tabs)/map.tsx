import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import MapView, { Marker, type MapMarker, type Region } from 'react-native-maps';

import {
  AppText,
  Button,
  EmptyState,
  ErrorState,
  JobCard,
  LoadingState,
  Screen,
} from '@/components';
import { useCurrentLocation, type LocationStatus } from '@/hooks/useCurrentLocation';
import { useJobFilters } from '@/hooks/useJobFilters';
import { useJob, useJobs, type JobListStatus } from '@/hooks/useJobs';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { colors, radii, spacing } from '@/theme';
import type { Job } from '@/types/database';
import { formatDistance, haversineKm, toPoint } from '@/utils/distance';
import { getErrorMessage } from '@/utils/errors';
import { formatTimeAgo } from '@/utils/format';

/** Used when location is denied or unavailable: the capital, where most jobs are. */
const PORT_MORESBY = { latitude: -9.4438, longitude: 147.1803 };
const CITY_ZOOM = { latitudeDelta: 0.15, longitudeDelta: 0.15 };
const JOB_ZOOM = { latitudeDelta: 0.03, longitudeDelta: 0.03 };
const INITIAL_REGION: Region = { ...PORT_MORESBY, ...CITY_ZOOM };
const ANIMATION_MS = 600;

type MappedJob = { job: Job; point: { latitude: number; longitude: number }; distanceKm: number };

export default function MapScreen() {
  // Set when the user taps "View on map" on a job detail screen.
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const location = useCurrentLocation();
  const { filters, isRestored, hasActiveFilters, clearFilters } = useJobFilters();
  const { status, jobs, offlineSavedAt, error, refetch } = useJobs(filters, {
    enabled: isRestored,
  });
  // The focused job may be hidden by the current filters, so load it on its own too.
  const { data: focusedJob } = useJob(jobId);
  const navigateOnce = useNavigateOnce();

  const mapRef = useRef<MapView>(null);
  const markerRefs = useRef(new Map<string, MapMarker>());
  const hasCentredOnUser = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const userCoordinates = location.status === 'granted' ? location.coordinates : null;
  const origin = userCoordinates ?? PORT_MORESBY;

  const mappedJobs = useMemo<MappedJob[]>(() => {
    const visible = status === 'success' || status === 'offline' ? jobs : [];
    const all =
      focusedJob && !visible.some((job) => job.id === focusedJob.id)
        ? [...visible, focusedJob]
        : visible;

    return all
      .flatMap((job) => {
        const point = toPoint(job.latitude, job.longitude);
        return point ? [{ job, point, distanceKm: haversineKm(origin, point) }] : [];
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [status, jobs, focusedJob, origin]);

  const focusTarget = jobId ? mappedJobs.find((mapped) => mapped.job.id === jobId) : undefined;
  const focusLatitude = focusTarget?.point.latitude;
  const focusLongitude = focusTarget?.point.longitude;

  // Zoom to the job opened from its detail screen and pop up its callout.
  useEffect(() => {
    if (!isMapReady || !jobId || focusLatitude === undefined || focusLongitude === undefined) {
      return;
    }
    mapRef.current?.animateToRegion(
      { latitude: focusLatitude, longitude: focusLongitude, ...JOB_ZOOM },
      ANIMATION_MS,
    );
    const timer = setTimeout(
      () => markerRefs.current.get(jobId)?.showCallout(),
      ANIMATION_MS + 100,
    );
    return () => clearTimeout(timer);
  }, [isMapReady, jobId, focusLatitude, focusLongitude]);

  // Centre on the user once their position arrives, unless a specific job is being shown.
  useEffect(() => {
    if (!isMapReady || !userCoordinates || jobId || hasCentredOnUser.current) return;
    hasCentredOnUser.current = true;
    mapRef.current?.animateToRegion({ ...userCoordinates, ...CITY_ZOOM }, ANIMATION_MS);
  }, [isMapReady, userCoordinates, jobId]);

  const openJob = (id: string) =>
    navigateOnce(() => router.push({ pathname: '/jobs/[id]', params: { id } }));

  return (
    <Screen edges={['left', 'right']} padded={false}>
      <LocationBanner location={location} />

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={INITIAL_REGION}
          showsUserLocation={location.status === 'granted'}
          showsMyLocationButton={location.status === 'granted'}
          toolbarEnabled={false}
          onMapReady={() => setIsMapReady(true)}
          accessibilityLabel="Map of jobs"
        >
          {mappedJobs.map(({ job, point, distanceKm }) => (
            <Marker
              key={job.id}
              ref={(marker) => {
                if (marker) markerRefs.current.set(job.id, marker);
                else markerRefs.current.delete(job.id);
              }}
              coordinate={point}
              pinColor={job.id === jobId ? colors.secondary : colors.primary}
              // The native callout is the most reliable on Android Google Maps; custom callout
              // views are drawn as static snapshots there.
              title={job.title}
              description={`${job.company} · ${formatDistance(distanceKm)} away – tap to view`}
              onCalloutPress={() => openJob(job.id)}
            />
          ))}
        </MapView>
        {location.status === 'loading' ? (
          <View style={styles.mapOverlay}>
            <AppText variant="caption" color="text">
              Finding your location…
            </AppText>
          </View>
        ) : null}
      </View>

      <FlatList
        style={styles.list}
        data={mappedJobs}
        keyExtractor={(mapped) => mapped.job.id}
        renderItem={({ item }) => (
          <JobCard
            job={item.job}
            distanceLabel={`${formatDistance(item.distanceKm)} away`}
            onPress={() => openJob(item.job.id)}
          />
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <AppText variant="subheading">Jobs near me</AppText>
            <AppText variant="caption">
              {describeOrigin(location.status, location.placeName)}
            </AppText>
            {status === 'offline' && offlineSavedAt ? (
              <AppText variant="caption" color="warning">
                Offline – last updated {formatTimeAgo(offlineSavedAt)}
              </AppText>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <ListEmpty
            status={status}
            errorMessage={getErrorMessage(error)}
            hasActiveFilters={hasActiveFilters}
            onRetry={() => void refetch()}
            onClearFilters={clearFilters}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </Screen>
  );
}

function describeOrigin(status: LocationStatus, placeName: string | null): string {
  if (status === 'loading') return 'Finding your location…';
  if (status === 'granted') return `You are near ${placeName ?? 'your current location'}`;
  return 'Distances are measured from Port Moresby';
}

function LocationBanner({ location }: { location: ReturnType<typeof useCurrentLocation> }) {
  if (location.status !== 'denied' && location.status !== 'error') return null;

  const message =
    location.status === 'denied'
      ? 'Location is off, so the map shows Port Moresby. Allow location to see jobs near you.'
      : (location.errorMessage ?? 'We could not find your location.');

  // Once Android stops showing the prompt, only the Settings app can grant permission.
  const action =
    location.status === 'denied' && !location.canAskAgain
      ? { title: 'Open settings', onPress: () => void location.openSettings() }
      : {
          title: location.status === 'denied' ? 'Allow location' : 'Retry',
          onPress: location.retry,
        };

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <AppText variant="caption" color="text" style={styles.bannerText}>
        {message}
      </AppText>
      <Button title={action.title} onPress={action.onPress} variant="ghost" fullWidth={false} />
    </View>
  );
}

function ListEmpty({
  status,
  errorMessage,
  hasActiveFilters,
  onRetry,
  onClearFilters,
}: {
  status: JobListStatus;
  errorMessage: string;
  hasActiveFilters: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
}) {
  let content: ReactNode;
  if (status === 'loading') {
    content = <LoadingState message="Loading jobs…" />;
  } else if (status === 'error') {
    content = <ErrorState title="Could not load jobs" message={errorMessage} onRetry={onRetry} />;
  } else if (status === 'offlineNoCache') {
    content = (
      <EmptyState
        icon="cloud-offline-outline"
        title="You're offline"
        message="Jobs will appear on the map when you're back online."
        action={{ label: 'Retry', onPress: onRetry }}
      />
    );
  } else if (hasActiveFilters) {
    content = (
      <EmptyState
        icon="map-outline"
        title="No jobs match your filters"
        message="The map uses the same filters as the Jobs tab."
        action={{ label: 'Clear filters', onPress: onClearFilters }}
      />
    );
  } else {
    content = (
      <EmptyState
        icon="map-outline"
        title="No jobs to show on the map"
        message="None of the open jobs have a location yet."
      />
    );
  }
  return <View style={styles.empty}>{content}</View>;
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.secondaryLight,
  },
  bannerText: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  listHeader: {
    gap: spacing.xs,
  },
  empty: {
    flexGrow: 1,
  },
});
