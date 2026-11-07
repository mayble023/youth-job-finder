import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Chip,
  DateTimeField,
  ErrorState,
  FormAlert,
  FormTextField,
  LoadingState,
  Screen,
} from '@/components';
import { useApplication, useUpdateApplication } from '@/hooks/useApplications';
import type { ApplicationWithJob } from '@/services/applications';
import { spacing } from '@/theme';
import { APPLICATION_STATUSES } from '@/types/database';
import { APPLICATION_STATUS_LABELS } from '@/utils/applications';
import { getErrorKind, getErrorMessage } from '@/utils/errors';
import { NOTES_MAX, editApplicationSchema } from '@/utils/validators/application';

export default function EditApplicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: application, error, isPending, refetch, isRefetching } = useApplication(id);

  if (application) return <EditApplicationForm application={application} />;

  if (isPending) {
    return (
      <Screen>
        <LoadingState message="Loading application…" />
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

function EditApplicationForm({ application }: { application: ApplicationWithJob }) {
  const updateApplication = useUpdateApplication(application.id);
  const [submitError, setSubmitError] = useState<unknown>(null);

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(editApplicationSchema),
    defaultValues: {
      status: application.status,
      interviewAt: application.interview_at ? new Date(application.interview_at) : null,
      notes: application.notes ?? '',
    },
    mode: 'onTouched',
  });
  const status = useWatch({ control, name: 'status' });

  usePreventRemove(updateApplication.isPending, () =>
    Alert.alert('Please wait', 'Your changes are still being saved.'),
  );

  // Go back in an effect so the "prevent leaving" guard above has already been lifted.
  const isSaved = updateApplication.isSuccess;
  useEffect(() => {
    if (isSaved) router.back();
  }, [isSaved]);

  const onSubmit = handleSubmit(async (values) => {
    if (updateApplication.isPending) return;
    setSubmitError(null);
    try {
      await updateApplication.mutateAsync({
        status: values.status,
        interviewAt: values.interviewAt ? values.interviewAt.toISOString() : null,
        notes: values.notes === '' ? null : values.notes,
      });
    } catch (error) {
      setSubmitError(error);
    }
  });

  const isBusy = updateApplication.isPending || isSaved;
  const errorKind = getErrorKind(submitError);

  return (
    <Screen scroll>
      <View style={styles.stack}>
        <AppText variant="subheading">{application.job?.title ?? 'Application'}</AppText>

        <Controller
          control={control}
          name="status"
          render={({ field: { value, onChange } }) => (
            <View style={styles.field}>
              <AppText variant="caption" color="text" style={styles.label}>
                Status
              </AppText>
              <View style={styles.chips} accessibilityRole="radiogroup">
                {APPLICATION_STATUSES.map((option) => (
                  <Chip
                    key={option}
                    label={APPLICATION_STATUS_LABELS[option]}
                    selected={value === option}
                    onPress={() => onChange(option)}
                    disabled={isBusy}
                  />
                ))}
              </View>
            </View>
          )}
        />

        {status === 'interviewing' ? (
          <Controller
            control={control}
            name="interviewAt"
            render={({ field: { value, onChange }, fieldState }) => (
              <DateTimeField
                label="Interview date and time"
                value={value}
                onChange={onChange}
                minimumDate={new Date()}
                error={fieldState.error?.message}
              />
            )}
          />
        ) : null}

        <FormTextField
          control={control}
          name="notes"
          label="Notes (optional)"
          hint="Only you can see these, e.g. who you spoke to or what to bring."
          multiline
          maxLength={NOTES_MAX}
          editable={!isBusy}
        />

        <FormAlert
          message={submitError ? getErrorMessage(submitError) : null}
          action={
            errorKind === 'network' || errorKind === 'timeout'
              ? { label: 'Retry', onPress: onSubmit, loading: updateApplication.isPending }
              : undefined
          }
        />

        <Button title="Save changes" icon="checkmark" onPress={onSubmit} loading={isBusy} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
