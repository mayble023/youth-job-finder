import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
} from '@/components';
import { useApplicationForJob } from '@/hooks/useApplications';
import { useJob } from '@/hooks/useJobs';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useSavedJobs, useToggleSavedJob } from '@/hooks/useSavedJobs';
import { colors, iconSizes, spacing } from '@/theme';
import type { Job } from '@/types/database';
import { getErrorKind, getErrorMessage } from '@/utils/errors';
import { formatClosingDate, formatSalaryRange } from '@/utils/format';
import { isJobClosed } from '@/utils/jobs';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: job, error, isPending, refetch, isRefetching } = useJob(id);

  if (job) return <JobDetail job={job} />;

  if (isPending) {
    return (
      <Screen>
        <LoadingState message="Loading job…" />
      </Screen>
    );
  }

  if (getErrorKind(error) === 'not_found') {
    return (
      <Screen>
        <EmptyState
          icon="briefcase-outline"
          title="Job not found"
          message={getErrorMessage(error)}
          action={{ label: 'Back to jobs', onPress: () => router.back() }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ErrorState
        title="Could not load this job"
        message={getErrorMessage(error)}
        onRetry={() => void refetch()}
        retrying={isRefetching}
      />
    </Screen>
  );
}

function JobDetail({ job }: { job: Job }) {
  const navigateOnce = useNavigateOnce();
  const savedJobs = useSavedJobs();
  const toggleSaved = useToggleSavedJob();
  const isSaved = savedJobs.data?.some((saved) => saved.id === job.id) ?? false;
  const isClosed = isJobClosed(job);
  const { data: myApplication } = useApplicationForJob(job.id);

  return (
    <Screen scroll>
      <View style={styles.stack}>
        <View style={styles.titleBlock}>
          <AppText variant="heading">{job.title}</AppText>
          <AppText color="textMuted">{job.company}</AppText>
        </View>

        <Card>
          <Fact icon="location-outline" text={job.town} />
          <Fact icon="briefcase-outline" text={`${job.job_type} · ${job.category}`} />
          <Fact icon="cash-outline" text={formatSalaryRange(job.salary_min, job.salary_max)} />
          <Fact icon="time-outline" text={formatClosingDate(job.closing_date)} />
        </Card>

        {job.tags.length > 0 ? (
          <View style={styles.tags} accessibilityLabel={`Skills: ${job.tags.join(', ')}`}>
            {job.tags.map((tag) => (
              <Chip key={tag} label={tag} />
            ))}
          </View>
        ) : null}

        <Section title="About the job" body={job.description} />
        <Section title="Requirements" body={job.requirements} />

        {myApplication ? (
          <Button
            title="Already applied – view application"
            icon="checkmark-done-outline"
            onPress={() =>
              navigateOnce(() =>
                router.push({
                  pathname: '/applications/[id]',
                  params: { id: myApplication.id },
                }),
              )
            }
          />
        ) : (
          <Button
            title={isClosed ? 'Applications closed' : 'Apply for this job'}
            icon="send-outline"
            disabled={isClosed}
            onPress={() =>
              navigateOnce(() =>
                router.push({ pathname: '/apply/[jobId]', params: { jobId: job.id } }),
              )
            }
          />
        )}
        <Button
          title={isSaved ? 'Saved' : 'Save job'}
          icon={isSaved ? 'bookmark' : 'bookmark-outline'}
          variant="secondary"
          // The list updates optimistically, so only block taps until the first load finishes.
          disabled={savedJobs.isPending}
          onPress={() => toggleSaved.mutate({ job, save: !isSaved })}
          accessibilityHint={isSaved ? 'Removes this job from your saved jobs' : undefined}
        />
        <Button
          title="View on map"
          icon="map-outline"
          variant="ghost"
          onPress={() =>
            navigateOnce(() => router.navigate({ pathname: '/map', params: { jobId: job.id } }))
          }
        />
      </View>
    </Screen>
  );
}

function Fact({
  icon,
  text,
}: {
  icon: 'location-outline' | 'briefcase-outline' | 'cash-outline' | 'time-outline';
  text: string;
}) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={iconSizes.md} color={colors.primary} />
      <AppText style={styles.factText}>{text}</AppText>
    </View>
  );
}

function Section({ title, body }: { title: string; body: string | null }) {
  if (!body) return null;
  return (
    <View style={styles.section}>
      <AppText variant="subheading">{title}</AppText>
      <AppText>{body}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
  titleBlock: {
    gap: spacing.xs,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  factText: {
    flex: 1,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
});
