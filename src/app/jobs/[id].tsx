import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Screen } from '@/components';
import { spacing } from '@/theme';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen scroll>
      <View style={styles.stack}>
        <Card>
          <AppText variant="heading">Job {id}</AppText>
          <AppText color="textMuted">
            The full job description, salary and tags load from the database in a later phase.
          </AppText>
        </Card>
        <Button
          title="Apply for this job"
          icon="send-outline"
          onPress={() => router.push({ pathname: '/apply/[jobId]', params: { jobId: id } })}
        />
        <Button
          title="View on map"
          icon="map-outline"
          variant="ghost"
          onPress={() => router.navigate({ pathname: '/map', params: { jobId: id } })}
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
