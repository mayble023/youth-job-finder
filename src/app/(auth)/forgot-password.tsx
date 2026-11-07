import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText, Button, FormAlert, FormTextField, Screen } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { spacing } from '@/theme';
import { getErrorKind, getErrorMessage } from '@/utils/errors';
import { forgotPasswordEmailSchema, resetPasswordSchema } from '@/utils/validators/auth';

export default function ForgotPasswordScreen() {
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);

  return (
    <Screen scroll>
      {codeSentTo ? (
        <ResetStep email={codeSentTo} onUseDifferentEmail={() => setCodeSentTo(null)} />
      ) : (
        <EmailStep onCodeSent={setCodeSentTo} />
      )}
    </Screen>
  );
}

function EmailStep({ onCodeSent }: { onCodeSent: (email: string) => void }) {
  const { sendPasswordResetCode } = useAuth();
  const [submitError, setSubmitError] = useState<unknown>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordEmailSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setSubmitError(null);
    try {
      await sendPasswordResetCode(email);
      onCodeSent(email);
    } catch (error) {
      setSubmitError(error);
    }
  });

  return (
    <View style={styles.stack}>
      <AppText variant="title">Reset your password</AppText>
      <AppText color="textMuted">
        Enter the email you signed up with and we will send you a 6-digit code.
      </AppText>

      <FormTextField
        control={control}
        name="email"
        label="Email"
        placeholder="name@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
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

      <Button title="Send code" icon="mail-outline" onPress={onSubmit} loading={isSubmitting} />
      <Button
        title="Back to log in"
        variant="ghost"
        onPress={() => router.back()}
        disabled={isSubmitting}
      />
    </View>
  );
}

function ResetStep({
  email,
  onUseDifferentEmail,
}: {
  email: string;
  onUseDifferentEmail: () => void;
}) {
  const { resetPasswordWithCode, sendPasswordResetCode } = useAuth();
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [isResending, setIsResending] = useState(false);
  const [resentMessage, setResentMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  // Success signs the user in, so the auth guard opens the app once the alert is shown.
  const onSubmit = handleSubmit(async ({ code, password }) => {
    setSubmitError(null);
    setResentMessage(null);
    try {
      await resetPasswordWithCode({ email, code, newPassword: password });
      Alert.alert('Password changed', 'Your new password is saved and you are now logged in.');
    } catch (error) {
      setSubmitError(error);
    }
  });

  const resend = async () => {
    setSubmitError(null);
    setResentMessage(null);
    setIsResending(true);
    try {
      await sendPasswordResetCode(email);
      setResentMessage(`We sent a new code to ${email}.`);
    } catch (error) {
      setSubmitError(error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.stack}>
      <AppText variant="title">Choose a new password</AppText>
      <AppText color="textMuted">
        If an account exists for {email}, we have sent it a 6-digit code.
      </AppText>

      <FormTextField
        control={control}
        name="code"
        label="6-digit code"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
      />
      <FormTextField
        control={control}
        name="password"
        label="New password"
        hint="At least 8 characters, including a number."
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        label="Confirm new password"
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
      <FormAlert message={resentMessage} tone="success" />

      <Button
        title="Save new password"
        icon="key-outline"
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
        disabled={isSubmitting || isResending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
});
