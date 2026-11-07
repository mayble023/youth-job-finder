import { zodResolver } from '@hookform/resolvers/zod';
import { router, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  ErrorState,
  FormAlert,
  FormTextField,
  LoadingState,
  OptionPickerModal,
  Screen,
  SkillsInput,
} from '@/components';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { colors, radii, sizes, spacing } from '@/theme';
import type { Profile } from '@/types/database';
import { getErrorKind, getErrorMessage } from '@/utils/errors';
import { JOB_TOWNS } from '@/utils/towns';
import { EDUCATION_MAX, profileSchema } from '@/utils/validators/profile';

const NO_TOWN = 'none';
const TOWN_OPTIONS = [
  { label: 'Not set / other town', value: NO_TOWN },
  ...JOB_TOWNS.map((town) => ({ label: town, value: town })),
];

export default function EditProfileScreen() {
  const { data: profile, error, isPending, refetch, isRefetching } = useProfile();

  if (profile) return <EditProfileForm profile={profile} />;

  if (isPending) {
    return (
      <Screen>
        <LoadingState message="Loading your profile…" />
      </Screen>
    );
  }

  return (
    <Screen>
      <ErrorState
        title="Could not load your profile"
        message={getErrorMessage(error)}
        onRetry={() => void refetch()}
        retrying={isRefetching}
      />
    </Screen>
  );
}

function EditProfileForm({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile();
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [isTownPickerOpen, setIsTownPickerOpen] = useState(false);

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.full_name ?? '',
      town: profile.town,
      education: profile.education ?? '',
      skills: profile.skills,
    },
    mode: 'onTouched',
  });

  usePreventRemove(updateProfile.isPending, () =>
    Alert.alert('Please wait', 'Your profile is still being saved.'),
  );

  // Go back in an effect so the "prevent leaving" guard above has already been lifted.
  const isSaved = updateProfile.isSuccess;
  useEffect(() => {
    if (isSaved) router.back();
  }, [isSaved]);

  const onSubmit = handleSubmit(async (values) => {
    if (updateProfile.isPending) return;
    setSubmitError(null);
    try {
      await updateProfile.mutateAsync({
        fullName: values.fullName,
        town: values.town,
        education: values.education === '' ? null : values.education,
        skills: values.skills,
      });
    } catch (error) {
      setSubmitError(error);
    }
  });

  const isBusy = updateProfile.isPending || isSaved;
  const errorKind = getErrorKind(submitError);

  return (
    <Screen scroll>
      <View style={styles.stack}>
        <FormTextField
          control={control}
          name="fullName"
          label="Full name"
          autoCapitalize="words"
          autoComplete="name"
          maxLength={60}
          editable={!isBusy}
        />

        <Controller
          control={control}
          name="town"
          render={({ field: { value, onChange } }) => (
            <View style={styles.field}>
              <AppText variant="caption" color="text" style={styles.label}>
                Town
              </AppText>
              <Pressable
                onPress={() => setIsTownPickerOpen(true)}
                disabled={isBusy}
                accessibilityRole="button"
                accessibilityLabel={`Town: ${value ?? 'not set'}. Tap to change.`}
                style={styles.picker}
              >
                <AppText color={value ? 'text' : 'textMuted'}>
                  {value ?? 'Choose your town'}
                </AppText>
              </Pressable>
              <AppText variant="caption">Used to recommend jobs close to you.</AppText>
              <OptionPickerModal
                visible={isTownPickerOpen}
                title="Choose your town"
                options={TOWN_OPTIONS}
                selectedValue={value ?? NO_TOWN}
                onSelect={(selected) => onChange(selected === NO_TOWN ? null : selected)}
                onClose={() => setIsTownPickerOpen(false)}
              />
            </View>
          )}
        />

        <FormTextField
          control={control}
          name="education"
          label="Education (optional)"
          placeholder="e.g. Grade 12, Diploma in IT (DWU)"
          maxLength={EDUCATION_MAX}
          editable={!isBusy}
        />

        <Controller
          control={control}
          name="skills"
          render={({ field: { value, onChange }, fieldState }) => (
            <SkillsInput
              value={value}
              onChange={onChange}
              error={fieldState.error?.message}
              disabled={isBusy}
            />
          )}
        />

        <FormAlert
          message={submitError ? getErrorMessage(submitError) : null}
          action={
            errorKind === 'network' || errorKind === 'timeout'
              ? { label: 'Retry', onPress: onSubmit, loading: updateProfile.isPending }
              : undefined
          }
        />

        <Button title="Save profile" icon="checkmark" onPress={onSubmit} loading={isBusy} />
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
  picker: {
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
});
