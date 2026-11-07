import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Screen } from '@/components';
import { spacing } from '@/theme';

export default function ApplyScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  return (
    <Screen scroll>
      <View style={styles.stack}>
        <Card>
          <AppText variant="subheading">Applying for job {jobId}</AppText>
          <AppText color="textMuted">
            The cover note form with validation and draft saving arrives in a later phase.
          </AppText>
        </Card>
        <Button
          title="Go to my applications"
          icon="document-text-outline"
          onPress={() => router.navigate('/applications')}
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
