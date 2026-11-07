import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Screen } from '@/components';
import { spacing } from '@/theme';

export default function EditProfileScreen() {
  return (
    <Screen scroll>
      <View style={styles.stack}>
        <Card>
          <AppText variant="subheading">Edit profile</AppText>
          <AppText color="textMuted">
            Name, town, education and skills fields arrive in a later phase.
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
