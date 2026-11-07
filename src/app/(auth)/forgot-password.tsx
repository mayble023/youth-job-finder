import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Screen } from '@/components';
import { spacing } from '@/theme';

export default function ForgotPasswordScreen() {
  return (
    <Screen scroll>
      <View style={styles.stack}>
        <AppText variant="title">Reset your password</AppText>
        <AppText color="textMuted">
          We will email you a 6-digit code to set a new password. The form arrives in Phase 2.
        </AppText>
        <Button title="Back to log in" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
});
