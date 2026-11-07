import { router } from 'expo-router';

import { EmptyState, Screen } from '@/components';

export default function SavedJobsScreen() {
  return (
    <Screen>
      <EmptyState
        icon="bookmark-outline"
        title="No saved jobs yet"
        message="Jobs you save will appear here."
        action={{ label: 'Browse jobs', onPress: () => router.navigate('/') }}
      />
    </Screen>
  );
}
