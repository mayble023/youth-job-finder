import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Screen } from '@/components';
import { spacing } from '@/theme';

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen scroll>
      <View style={styles.stack}>
        <Card>
          <AppText variant="subheading">Application {id}</AppText>
          <AppText color="textMuted">
            Status, interview date and notes load from the database in a later phase.
          </AppText>
        </Card>
        <Button
          title="Edit application"
          icon="create-outline"
          onPress={() => router.push({ pathname: '/applications/[id]/edit', params: { id } })}
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
