import { router } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { EmptyState, ErrorState, JobCard, LoadingState, Screen } from '@/components';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useSavedJobs } from '@/hooks/useSavedJobs';
import { colors, spacing } from '@/theme';
import { getErrorMessage } from '@/utils/errors';

export default function SavedJobsScreen() {
  const {
    data: jobs,
    error,
    isPending,
    isError,
    fetchStatus,
    refetch,
    isRefetching,
  } = useSavedJobs();
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const navigateOnce = useNavigateOnce();

  const onRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    await refetch();
    setIsPullRefreshing(false);
  }, [refetch]);

  let emptyContent: ReactNode;
  if (isError) {
    emptyContent = (
      <ErrorState
        title="Could not load saved jobs"
        message={getErrorMessage(error)}
        onRetry={() => void refetch()}
        retrying={isRefetching}
      />
    );
  } else if (isPending && fetchStatus === 'paused') {
    emptyContent = (
      <EmptyState
        icon="cloud-offline-outline"
        title="You're offline"
        message="Your saved jobs will load when you're back online."
        action={{ label: 'Retry', onPress: () => void refetch() }}
      />
    );
  } else if (isPending) {
    emptyContent = <LoadingState message="Loading saved jobs…" />;
  } else {
    emptyContent = (
      <EmptyState
        icon="bookmark-outline"
        title="No saved jobs yet"
        message="Tap “Save job” on any job to keep it here for later."
        action={{ label: 'Browse jobs', onPress: () => router.navigate('/') }}
      />
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={jobs ?? []}
        keyExtractor={(job) => job.id}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() =>
              navigateOnce(() => router.push({ pathname: '/jobs/[id]', params: { id: item.id } }))
            }
          />
        )}
        ListEmptyComponent={<View style={styles.empty}>{emptyContent}</View>}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  empty: {
    flexGrow: 1,
  },
});
