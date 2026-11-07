import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormAlert,
  FormTextField,
  LoadingState,
  Screen,
} from '@/components';
import { useApplicationDraft } from '@/hooks/useApplicationDraft';
import { useApplicationForJob, useCreateApplication } from '@/hooks/useApplications';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useJob } from '@/hooks/useJobs';
import { spacing } from '@/theme';
import type { Job } from '@/types/database';
import { getErrorKind, getErrorMessage } from '@/utils/errors';
import { formatClosingDate } from '@/utils/format';
import { isJobClosed } from '@/utils/jobs';
import { COVER_NOTE_MAX, COVER_NOTE_MIN, applySchema } from '@/utils/validators/application';

const DRAFT_SAVE_DELAY_MS = 500;

export default function ApplyScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const job = useJob(jobId);
  const existing = useApplicationForJob(jobId);
  const draft = useApplicationDraft(jobId);

  if (job.data === undefined) {
    if (job.isPending) return <CenteredLoading message="Loading job…" />;
    return (
      <Screen>
        <ErrorState
          title="Could not load this job"
          message={getErrorMessage(job.error)}
          onRetry={() => void job.refetch()}
          retrying={job.isRefetching}
        />
      </Screen>
    );
  }

  if (existing.data) {
    const applicationId = existing.data.id;
    return (
      <Screen>
        <EmptyState
          icon="checkmark-done-outline"
          title="You've already applied"
          message={`You applied for ${job.data.title}. You can track it in My applications.`}
          action={{
            label: 'View application',
            onPress: () =>
              router.replace({ pathname: '/applications/[id]', params: { id: applicationId } }),
          }}
        />
      </Screen>
    );
  }

  if (isJobClosed(job.data)) {
    return (
      <Screen>
        <EmptyState
          icon="lock-closed-outline"
          title="Applications have closed"
          message="This job is no longer taking applications."
          action={{ label: 'Back to job', onPress: () => router.back() }}
        />
      </Screen>
    );
  }

  // If the check fails (e.g. offline) we still show the form; the database refuses duplicates.
  const isCheckingExisting = existing.isPending && existing.fetchStatus === 'fetching';
  if (!draft.isRestored || isCheckingExisting) {
    return <CenteredLoading message="Getting your application ready…" />;
  }

  return (
    <ApplyForm
      job={job.data}
      restoredDraft={draft.restoredDraft ?? ''}
      saveDraft={draft.saveDraft}
      clearDraft={draft.clearDraft}
    />
  );
}

function CenteredLoading({ message }: { message: string }) {
  return (
    <Screen>
      <LoadingState message={message} />
    </Screen>
  );
}

type ApplyFormProps = {
  job: Job;
  restoredDraft: string;
  saveDraft: (coverNote: string) => Promise<void>;
  clearDraft: () => Promise<void>;
};

function ApplyForm({ job, restoredDraft, saveDraft, clearDraft }: ApplyFormProps) {
  const createApplication = useCreateApplication();
  const [submitError, setSubmitError] = useState<unknown>(null);

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(applySchema),
    defaultValues: { coverNote: restoredDraft },
    mode: 'onTouched',
  });

  const coverNote = useWatch({ control, name: 'coverNote' });
  const debouncedCoverNote = useDebouncedValue(coverNote, DRAFT_SAVE_DELAY_MS);
  useEffect(() => {
    void saveDraft(debouncedCoverNote);
  }, [debouncedCoverNote, saveDraft]);

  // Leaving mid-request could let the user come back and send it twice.
  usePreventRemove(createApplication.isPending, () =>
    Alert.alert('Please wait', 'Your application is still being sent.'),
  );

  // Navigate in an effect so the "prevent leaving" guard above has already been lifted.
  // replace() also removes this form from history, so Back cannot resubmit it.
  const createdId = createApplication.data?.id;
  useEffect(() => {
    if (!createdId) return;
    void clearDraft();
    router.replace({ pathname: '/applications/[id]', params: { id: createdId } });
  }, [createdId, clearDraft]);

  const onSubmit = handleSubmit(async (values) => {
    if (createApplication.isPending) return;
    setSubmitError(null);
    try {
      await createApplication.mutateAsync({ jobId: job.id, coverNote: values.coverNote });
    } catch (error) {
      setSubmitError(error);
    }
  });

  const errorKind = getErrorKind(submitError);
  const isBusy = createApplication.isPending || createApplication.isSuccess;

  return (
    <Screen scroll>
      <View style={styles.stack}>
        <Card>
          <AppText variant="subheading">{job.title}</AppText>
          <AppText color="textMuted">
            {job.company} · {job.town}
          </AppText>
          <AppText variant="caption">{formatClosingDate(job.closing_date)}</AppText>
        </Card>

        {restoredDraft ? (
          <AppText variant="caption" color="primary">
            We restored the cover note you started earlier.
          </AppText>
        ) : null}

        <FormTextField
          control={control}
          name="coverNote"
          label="Cover note"
          hint={`Tell the employer why you suit this job (at least ${COVER_NOTE_MIN} characters).`}
          placeholder="I am interested in this role because…"
          multiline
          maxLength={COVER_NOTE_MAX}
          editable={!isBusy}
        />

        <FormAlert
          message={submitError ? getErrorMessage(submitError) : null}
          action={
            errorKind === 'duplicate'
              ? { label: 'View my applications', onPress: () => router.replace('/applications') }
              : errorKind === 'network' || errorKind === 'timeout'
                ? { label: 'Retry', onPress: onSubmit, loading: createApplication.isPending }
                : undefined
          }
        />

        <Button title="Send application" icon="send-outline" onPress={onSubmit} loading={isBusy} />
        <AppText variant="caption" align="center">
          Your draft is saved on this phone until you send it.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
});
