import { router } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { ApplicationCard, Chip, EmptyState, ErrorState, LoadingState, Screen } from '@/components';
import { useMyApplications } from '@/hooks/useApplications';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { colors, spacing } from '@/theme';
import { APPLICATION_STATUSES, type ApplicationStatus } from '@/types/database';
import { APPLICATION_STATUS_LABELS } from '@/utils/applications';
import { getErrorMessage } from '@/utils/errors';

export default function ApplicationsScreen() {
  const { data, error, isPending, isError, fetchStatus, refetch, isRefetching } =
    useMyApplications();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | null>(null);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const navigateOnce = useNavigateOnce();

  const applications = useMemo(() => data ?? [], [data]);
  const visible = useMemo(
    () =>
      statusFilter
        ? applications.filter((application) => application.status === statusFilter)
        : applications,
    [applications, statusFilter],
  );
  const countFor = (status: ApplicationStatus) =>
    applications.filter((application) => application.status === status).length;

  const onRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    await refetch();
    setIsPullRefreshing(false);
  }, [refetch]);

  const filterChips = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      <Chip
        label={`All (${applications.length})`}
        selected={statusFilter === null}
        onPress={() => setStatusFilter(null)}
      />
      {APPLICATION_STATUSES.map((status) => (
        <Chip
          key={status}
          label={`${APPLICATION_STATUS_LABELS[status]} (${countFor(status)})`}
          selected={statusFilter === status}
          onPress={() => setStatusFilter(statusFilter === status ? null : status)}
        />
      ))}
    </ScrollView>
  );

  let emptyContent: ReactNode;
  if (isError) {
    emptyContent = (
      <ErrorState
        title="Could not load your applications"
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
        message="Your applications will load when you're back online."
        action={{ label: 'Retry', onPress: () => void refetch() }}
      />
    );
  } else if (isPending) {
    emptyContent = <LoadingState message="Loading your applications…" />;
  } else if (statusFilter) {
    emptyContent = (
      <EmptyState
        icon="filter-outline"
        title={`No ${APPLICATION_STATUS_LABELS[statusFilter].toLowerCase()} applications`}
        action={{ label: 'Show all', onPress: () => setStatusFilter(null) }}
      />
    );
  } else {
    emptyContent = (
      <EmptyState
        icon="document-text-outline"
        title="No applications yet"
        message="When you apply for a job, you can track its progress here."
        action={{ label: 'Browse jobs', onPress: () => router.navigate('/') }}
      />
    );
  }

  return (
    <Screen edges={['left', 'right']} padded={false}>
      <FlatList
        data={visible}
        keyExtractor={(application) => application.id}
        renderItem={({ item }) => (
          <ApplicationCard
            application={item}
            onPress={() =>
              navigateOnce(() =>
                router.push({ pathname: '/applications/[id]', params: { id: item.id } }),
              )
            }
          />
        )}
        ListHeaderComponent={applications.length > 0 ? filterChips : undefined}
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
  chipRow: {
    gap: spacing.sm,
  },
  empty: {
    flexGrow: 1,
  },
});
