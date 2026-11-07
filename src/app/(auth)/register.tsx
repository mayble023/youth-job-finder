import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Screen } from '@/components';
import { spacing } from '@/theme';

export default function RegisterScreen() {
  return (
    <Screen scroll>
      <View style={styles.stack}>
        <AppText variant="title">Create your account</AppText>
        <AppText color="textMuted">
          Name, email and password fields, plus the 6-digit email code step, arrive in Phase 2.
        </AppText>
        <Button
          title="Already have an account? Log in"
          variant="ghost"
          onPress={() => router.back()}
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
