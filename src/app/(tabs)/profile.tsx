import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Screen } from '@/components';
import { spacing } from '@/theme';

export default function ProfileScreen() {
  return (
    <Screen scroll edges={['left', 'right']}>
      <View style={styles.stack}>
        <Card>
          <AppText variant="subheading">Your profile</AppText>
          <AppText color="textMuted">
            Name, town, skills and your CV will show here in a later phase.
          </AppText>
        </Card>
        <Button
          title="Edit profile"
          icon="create-outline"
          onPress={() => router.push('/profile/edit')}
        />
        <Button
          title="Saved jobs"
          icon="bookmark-outline"
          variant="secondary"
          onPress={() => router.push('/saved')}
        />
        {/* Temporary entry point: login becomes the start screen once auth exists (Phase 2). */}
        <Button
          title="Go to login screen"
          icon="log-in-outline"
          variant="ghost"
          onPress={() => router.push('/login')}
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
