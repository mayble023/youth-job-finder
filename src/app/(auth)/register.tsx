import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, FormAlert, FormTextField, Screen } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { spacing } from '@/theme';
import { getErrorKind, getErrorMessage } from '@/utils/errors';
import { registerSchema, verifyCodeSchema } from '@/utils/validators/auth';

export default function RegisterScreen() {
  // Login sends an unconfirmed user here with their email to go straight to the code step.
  const { email: emailFromLogin } = useLocalSearchParams<{ email?: string }>();
  const [pendingEmail, setPendingEmail] = useState<string | null>(emailFromLogin ?? null);

  return (
    <Screen scroll>
      {pendingEmail ? (
        <VerifyCodeStep email={pendingEmail} onUseDifferentEmail={() => setPendingEmail(null)} />
      ) : (
        <DetailsStep onRegistered={setPendingEmail} />
      )}
    </Screen>
  );
}

function DetailsStep({ onRegistered }: { onRegistered: (email: string) => void }) {
  const { signUp } = useAuth();
  const [submitError, setSubmitError] = useState<unknown>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(async ({ fullName, email, password }) => {
    setSubmitError(null);
    try {
      await signUp({ fullName, email, password });
      onRegistered(email);
    } catch (error) {
      setSubmitError(error);
    }
  });

  return (
    <View style={styles.stack}>
      <AppText variant="title">Create your account</AppText>
      <AppText color="textMuted">We will email you a 6-digit code to confirm your address.</AppText>

      <FormTextField
        control={control}
        name="fullName"
        label="Full name"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        maxLength={60}
      />
      <FormTextField
        control={control}
        name="email"
        label="Email"
        placeholder="name@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <FormTextField
        control={control}
        name="password"
        label="Password"
        hint="At least 8 characters, including a number."
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        label="Confirm password"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={() => onSubmit()}
      />

      <FormAlert
        message={submitError ? getErrorMessage(submitError) : null}
        action={
          getErrorKind(submitError) === 'network'
            ? { label: 'Retry', onPress: onSubmit, loading: isSubmitting }
            : undefined
        }
      />

      <Button
        title="Create account"
        icon="person-add-outline"
        onPress={onSubmit}
        loading={isSubmitting}
      />
      <Button
        title="Already have an account? Log in"
        variant="ghost"
        onPress={() => router.back()}
        disabled={isSubmitting}
      />
    </View>
  );
}

function VerifyCodeStep({
  email,
  onUseDifferentEmail,
}: {
  email: string;
  onUseDifferentEmail: () => void;
}) {
  const { verifySignupCode, resendSignupCode } = useAuth();
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [isResending, setIsResending] = useState(false);
  const [resentMessage, setResentMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: '' },
    mode: 'onTouched',
  });

  // A correct code signs the user in, and the auth guard then opens the app.
  const onSubmit = handleSubmit(async ({ code }) => {
    setSubmitError(null);
    setResentMessage(null);
    try {
      await verifySignupCode({ email, code });
    } catch (error) {
      setSubmitError(error);
    }
  });

  const resend = async () => {
    setSubmitError(null);
    setResentMessage(null);
    setIsResending(true);
    try {
      await resendSignupCode(email);
      setResentMessage(`We sent a new code to ${email}.`);
    } catch (error) {
      setSubmitError(error);
    } finally {
      setIsResending(false);
    }
  };

  const isBusy = isSubmitting || isResending;

  return (
    <View style={styles.stack}>
      <AppText variant="title">Check your email</AppText>
      <AppText color="textMuted">Enter the 6-digit code we sent to {email}.</AppText>

      <FormTextField
        control={control}
        name="code"
        label="6-digit code"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        onSubmitEditing={() => onSubmit()}
      />

      <FormAlert
        message={submitError ? getErrorMessage(submitError) : null}
        action={
          getErrorKind(submitError) === 'network'
            ? { label: 'Retry', onPress: onSubmit, loading: isSubmitting }
            : undefined
        }
      />
      <FormAlert message={resentMessage} tone="success" />

      <Button
        title="Confirm email"
        icon="checkmark-circle-outline"
        onPress={onSubmit}
        loading={isSubmitting}
        disabled={isResending}
      />
      <Button
        title="Send a new code"
        variant="ghost"
        onPress={resend}
        loading={isResending}
        disabled={isSubmitting}
      />
      <Button
        title="Use a different email"
        variant="ghost"
        onPress={onUseDifferentEmail}
        disabled={isBusy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
});
