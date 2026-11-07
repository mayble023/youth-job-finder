import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Screen } from '@/components';
import { spacing } from '@/theme';

export default function LoginScreen() {
  return (
    <Screen scroll>
      <View style={styles.stack}>
        <AppText variant="title">Welcome back</AppText>
        <AppText color="textMuted">
          Email and password fields with validation arrive with authentication in Phase 2.
        </AppText>
        <Button
          title="Continue to the app"
          icon="log-in-outline"
          onPress={() => router.navigate('/')}
        />
        <Button
          title="Create an account"
          variant="ghost"
          onPress={() => router.push('/register')}
        />
        <Button
          title="Forgot password?"
          variant="ghost"
          onPress={() => router.push('/forgot-password')}
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
