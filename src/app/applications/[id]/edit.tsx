import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Screen } from '@/components';
import { spacing } from '@/theme';

export default function EditApplicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen scroll>
      <View style={styles.stack}>
        <Card>
          <AppText variant="subheading">Editing application {id}</AppText>
          <AppText color="textMuted">
            The status picker, interview date and notes form arrive in a later phase.
          </AppText>
        </Card>
        <Button title="Done" icon="checkmark" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
});
