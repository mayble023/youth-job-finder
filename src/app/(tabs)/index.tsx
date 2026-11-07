import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, Screen } from '@/components';
import { spacing } from '@/theme';

// Placeholder IDs so the job detail route can be opened before real data arrives in Phase 3.
const PLACEHOLDER_JOB_IDS = ['sample-1', 'sample-2'];

export default function JobsScreen() {
  return (
    <Screen scroll edges={['left', 'right']}>
      <View style={styles.stack}>
        <AppText variant="heading">Find your next job</AppText>
        <AppText color="textMuted">
          Search, filters and the real job list arrive in a later phase. Tap a sample job to see the
          detail screen.
        </AppText>
        {PLACEHOLDER_JOB_IDS.map((jobId, index) => (
          <Card
            key={jobId}
            accessibilityLabel={`Open sample job ${index + 1}`}
            onPress={() => router.push({ pathname: '/jobs/[id]', params: { id: jobId } })}
          >
            <AppText variant="subheading">Sample job {index + 1}</AppText>
            <AppText variant="caption">Placeholder company · Port Moresby</AppText>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
});
