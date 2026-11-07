import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, FormAlert, FormTextField, Screen } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { spacing } from '@/theme';
import { getErrorKind, getErrorMessage } from '@/utils/errors';
import { loginSchema } from '@/utils/validators/auth';

export default function LoginScreen() {
  const { signIn, resendSignupCode } = useAuth();
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [isResending, setIsResending] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  // On success the auth guard in the root layout swaps to the signed-in screens by itself.
  const onSubmit = handleSubmit(async ({ email, password }) => {
    setSubmitError(null);
    try {
      await signIn({ email, password });
    } catch (error) {
      setSubmitError(error);
    }
  });

  const sendNewCode = async () => {
    const email = getValues('email').trim().toLowerCase();
    setIsResending(true);
    try {
      await resendSignupCode(email);
      router.push({ pathname: '/register', params: { email } });
    } catch (error) {
      setSubmitError(error);
    } finally {
      setIsResending(false);
    }
  };

  const errorKind = getErrorKind(submitError);
  const errorAction =
    errorKind === 'email_not_confirmed'
      ? { label: 'Send a new code', onPress: sendNewCode, loading: isResending }
      : errorKind === 'network'
        ? { label: 'Retry', onPress: onSubmit, loading: isSubmitting }
        : undefined;

  return (
    <Screen scroll>
      <View style={styles.stack}>
        <AppText variant="title">Welcome back</AppText>
        <AppText color="textMuted">Log in to find jobs and track your applications.</AppText>

        <FormTextField
          control={control}
          name="email"
          label="Email"
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <FormTextField
          control={control}
          name="password"
          label="Password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={() => onSubmit()}
        />

        <FormAlert
          message={submitError ? getErrorMessage(submitError) : null}
          action={errorAction}
        />

        <Button
          title="Log in"
          icon="log-in-outline"
          onPress={onSubmit}
          loading={isSubmitting}
          disabled={isResending}
        />
        <Button
          title="Forgot password?"
          variant="ghost"
          onPress={() => router.push('/forgot-password')}
          disabled={isSubmitting}
        />
        <Button
          title="New here? Create an account"
          variant="ghost"
          onPress={() => router.push('/register')}
          disabled={isSubmitting}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
});
