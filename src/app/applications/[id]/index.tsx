import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormAlert,
  LoadingState,
  Screen,
  StatusBadge,
} from '@/components';
import { useApplication, useDeleteApplication } from '@/hooks/useApplications';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import type { ApplicationWithJob } from '@/services/applications';
import { spacing } from '@/theme';
import { getErrorKind, getErrorMessage } from '@/utils/errors';
import { formatDate, formatDateTime } from '@/utils/format';

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: application, error, isPending, refetch, isRefetching } = useApplication(id);

  if (application) return <ApplicationDetail application={application} />;

  if (isPending) {
    return (
      <Screen>
        <LoadingState message="Loading application…" />
      </Screen>
    );
  }

  if (getErrorKind(error) === 'not_found') {
    return (
      <Screen>
        <EmptyState
          icon="document-text-outline"
          title="Application not found"
          message={getErrorMessage(error)}
          action={{ label: 'My applications', onPress: () => router.navigate('/applications') }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ErrorState
        title="Could not load this application"
        message={getErrorMessage(error)}
        onRetry={() => void refetch()}
        retrying={isRefetching}
      />
    </Screen>
  );
}

function ApplicationDetail({ application }: { application: ApplicationWithJob }) {
  const navigateOnce = useNavigateOnce();
  const deleteApplication = useDeleteApplication();
  const [deleteError, setDeleteError] = useState<unknown>(null);
  const { job } = application;

  usePreventRemove(deleteApplication.isPending, () =>
    Alert.alert('Please wait', 'Your application is being withdrawn.'),
  );

  // Go back in an effect so the "prevent leaving" guard above has already been lifted.
  const isWithdrawn = deleteApplication.isSuccess;
  useEffect(() => {
    if (isWithdrawn) router.back();
  }, [isWithdrawn]);

  const withdraw = async () => {
    setDeleteError(null);
    try {
      await deleteApplication.mutateAsync({ id: application.id, jobId: application.job_id });
    } catch (error) {
      setDeleteError(error);
    }
  };

  const confirmWithdraw = () => {
    Alert.alert(
      'Withdraw application?',
      `This deletes your application${job ? ` for ${job.title}` : ''}. You can apply again later if the job is still open.`,
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Withdraw', style: 'destructive', onPress: () => void withdraw() },
      ],
    );
  };

  const isBusy = deleteApplication.isPending || isWithdrawn;

  return (
    <Screen scroll>
      <View style={styles.stack}>
        <Card
          onPress={
            job
              ? () =>
                  navigateOnce(() =>
                    router.push({ pathname: '/jobs/[id]', params: { id: application.job_id } }),
                  )
              : undefined
          }
          accessibilityLabel={job ? `Open job ${job.title}` : undefined}
        >
          <AppText variant="subheading">{job?.title ?? 'Job no longer listed'}</AppText>
          {job ? (
            <AppText color="textMuted">
              {job.company} · {job.town}
            </AppText>
          ) : null}
          {job ? (
            <AppText variant="caption" color="primary">
              View job details
            </AppText>
          ) : null}
        </Card>

        <Card>
          <StatusBadge status={application.status} />
          <AppText variant="caption">Applied {formatDate(application.created_at)}</AppText>
          {application.updated_at !== application.created_at ? (
            <AppText variant="caption">Last updated {formatDate(application.updated_at)}</AppText>
          ) : null}
          {application.status === 'interviewing' && application.interview_at ? (
            <AppText color="warning">Interview: {formatDateTime(application.interview_at)}</AppText>
          ) : null}
        </Card>

        <Section title="Your cover note" body={application.cover_note} />
        <Section title="Your notes" body={application.notes} />

        <FormAlert message={deleteError ? getErrorMessage(deleteError) : null} />

        <Button
          title="Edit application"
          icon="create-outline"
          disabled={isBusy}
          onPress={() =>
            navigateOnce(() =>
              router.push({ pathname: '/applications/[id]/edit', params: { id: application.id } }),
            )
          }
        />
        <Button
          title="Withdraw application"
          icon="trash-outline"
          variant="danger"
          loading={isBusy}
          onPress={confirmWithdraw}
        />
      </View>
    </Screen>
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
  section: {
    gap: spacing.sm,
  },
});
