import { router } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import {
  AppText,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  JobCard,
  LoadingState,
  OptionPickerModal,
  RecommendationCard,
  Screen,
  TextField,
} from '@/components';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useJobFilters } from '@/hooks/useJobFilters';
import { useJobs } from '@/hooks/useJobs';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useRecommendedJobs } from '@/hooks/useRecommendedJobs';
import type { JobFilters } from '@/services/jobs';
import { colors, spacing } from '@/theme';
import { JOB_CATEGORIES, JOB_TYPES, type Job } from '@/types/database';
import { getErrorMessage } from '@/utils/errors';
import { formatTimeAgo } from '@/utils/format';
import { JOB_TOWNS } from '@/utils/towns';

const SEARCH_MAX_LENGTH = 100;
const SEARCH_DEBOUNCE_MS = 300;
const ALL_TOWNS = 'all';
const TOWN_OPTIONS = [
  { label: 'All towns', value: ALL_TOWNS },
  ...JOB_TOWNS.map((town) => ({ label: town, value: town })),
];

export default function JobsScreen() {
  const jobFilters = useJobFilters();

  // Wait for the remembered filters so the first request already uses them.
  if (!jobFilters.isRestored) {
    return (
      <Screen edges={['left', 'right']}>
        <LoadingState message="Loading jobs…" />
      </Screen>
    );
  }

  return <JobList {...jobFilters} />;
}

type JobListProps = {
  filters: JobFilters;
  updateFilters: (changes: Partial<JobFilters>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
};

function JobList({ filters, updateFilters, clearFilters, hasActiveFilters }: JobListProps) {
  const [searchText, setSearchText] = useState(filters.search);
  const [isTownPickerOpen, setIsTownPickerOpen] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const navigateOnce = useNavigateOnce();

  // Only query once typing pauses, instead of on every keystroke.
  const debouncedSearch = useDebouncedValue(searchText.trim(), SEARCH_DEBOUNCE_MS);
  useEffect(() => {
    updateFilters({ search: debouncedSearch });
  }, [debouncedSearch, updateFilters]);

  const { status, jobs, offlineSavedAt, error, refetch } = useJobs(filters);

  const onRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    await refetch();
    setIsPullRefreshing(false);
  }, [refetch]);

  const resetFilters = () => {
    setSearchText('');
    clearFilters();
  };

  const openJob = (job: Job) =>
    navigateOnce(() => router.push({ pathname: '/jobs/[id]', params: { id: job.id } }));

  const header = (
    <View style={styles.header}>
      <RecommendedSection onOpenJob={openJob} />

      <TextField
        label="Search jobs"
        placeholder="Job title or company"
        value={searchText}
        onChangeText={setSearchText}
        maxLength={SEARCH_MAX_LENGTH}
        returnKeyType="search"
        autoCorrect={false}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        keyboardShouldPersistTaps="handled"
      >
        <Chip
          label={filters.town ?? 'All towns'}
          icon="location-outline"
          selected={filters.town !== null}
          onPress={() => setIsTownPickerOpen(true)}
        />
        {JOB_TYPES.map((jobType) => (
          <Chip
            key={jobType}
            label={jobType}
            selected={filters.jobType === jobType}
            onPress={() => updateFilters({ jobType: filters.jobType === jobType ? null : jobType })}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        keyboardShouldPersistTaps="handled"
      >
        {JOB_CATEGORIES.map((category) => (
          <Chip
            key={category}
            label={category}
            selected={filters.category === category}
            onPress={() =>
              updateFilters({ category: filters.category === category ? null : category })
            }
          />
        ))}
      </ScrollView>

      {status === 'offline' && offlineSavedAt ? (
        <AppText variant="caption" color="warning">
          Offline – last updated {formatTimeAgo(offlineSavedAt)}
        </AppText>
      ) : null}
      {(status === 'success' || status === 'offline') && jobs.length > 0 ? (
        <AppText variant="caption">
          {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found
        </AppText>
      ) : null}
    </View>
  );

  let emptyContent: ReactNode;
  if (status === 'loading') {
    emptyContent = <LoadingState message="Finding jobs…" />;
  } else if (status === 'error') {
    emptyContent = (
      <ErrorState
        title="Could not load jobs"
        message={getErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  } else if (status === 'offlineNoCache') {
    emptyContent = (
      <EmptyState
        icon="cloud-offline-outline"
        title="You're offline"
        message="Connect to the internet to see jobs. They will load as soon as you're back online."
        action={{ label: 'Retry', onPress: () => void refetch() }}
      />
    );
  } else if (hasActiveFilters) {
    emptyContent = (
      <EmptyState
        icon="search-outline"
        title="No jobs match your filters"
        message="Try a different search, town or job type."
        action={{ label: 'Clear filters', onPress: resetFilters }}
      />
    );
  } else {
    emptyContent = (
      <EmptyState
        icon="briefcase-outline"
        title="No open jobs right now"
        message="New jobs are added regularly. Pull down to check again."
      />
    );
  }

  return (
    <Screen edges={['left', 'right']} padded={false}>
      <FlatList
        data={status === 'success' || status === 'offline' ? jobs : []}
        keyExtractor={(job) => job.id}
        renderItem={({ item }) => <JobCard job={item} onPress={() => openJob(item)} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<View style={styles.empty}>{emptyContent}</View>}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
      <OptionPickerModal
        visible={isTownPickerOpen}
        title="Choose a town"
        options={TOWN_OPTIONS}
        selectedValue={filters.town ?? ALL_TOWNS}
        onSelect={(value) => updateFilters({ town: value === ALL_TOWNS ? null : value })}
        onClose={() => setIsTownPickerOpen(false)}
      />
    </Screen>
  );
}

function RecommendedSection({ onOpenJob }: { onOpenJob: (job: Job) => void }) {
  const { status, recommendations, retry } = useRecommendedJobs();
  const navigateOnce = useNavigateOnce();

  let content: ReactNode;
  if (status === 'loading') {
    content = (
      <View style={styles.recommendationMessage}>
        <ActivityIndicator color={colors.primary} />
        <AppText variant="caption">Finding jobs that suit you…</AppText>
      </View>
    );
  } else if (status === 'noSkills') {
    content = (
      <Card>
        <AppText>Add your skills to see jobs picked for you.</AppText>
        <Button
          title="Add skills in Edit profile"
          icon="create-outline"
          variant="ghost"
          onPress={() => navigateOnce(() => router.push('/profile/edit'))}
        />
      </Card>
    );
  } else if (status === 'error') {
    content = (
      <View style={styles.recommendationMessage}>
        <AppText variant="caption" style={styles.recommendationText}>
          Could not load recommendations.
        </AppText>
        <Button title="Retry" variant="ghost" fullWidth={false} onPress={retry} />
      </View>
    );
  } else if (status === 'empty') {
    content = (
      <AppText variant="caption">
        No open jobs match your skills yet. Try adding more skills in your profile.
      </AppText>
    );
  } else {
    content = (
      <FlatList
        horizontal
        data={recommendations}
        keyExtractor={(recommended) => recommended.job.id}
        renderItem={({ item }) => (
          <RecommendationCard
            job={item.job}
            score={item.score}
            reasons={item.reasons}
            onPress={() => onOpenJob(item.job)}
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      />
    );
  }

  return (
    <View style={styles.recommendations}>
      <AppText variant="subheading">Recommended for you</AppText>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  recommendations: {
    gap: spacing.sm,
  },
  recommendationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recommendationText: {
    flex: 1,
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  chipRow: {
    gap: spacing.sm,
  },
  empty: {
    flexGrow: 1,
  },
});
