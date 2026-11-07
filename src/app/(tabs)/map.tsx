import { router, useLocalSearchParams } from 'expo-router';

import { EmptyState, Screen } from '@/components';

export default function MapScreen() {
  // Set when the user taps "View on map" on a job; the map will focus that job in Phase 4.
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();

  return (
    <Screen edges={['left', 'right']}>
      <EmptyState
        icon="map-outline"
        title="Map coming soon"
        message={
          jobId ? `The map will focus on job ${jobId}.` : 'Jobs near you will appear on a map here.'
        }
        action={{
          label: 'Open a sample job',
          onPress: () => router.push({ pathname: '/jobs/[id]', params: { id: 'sample-1' } }),
        }}
      />
    </Screen>
  );
}
