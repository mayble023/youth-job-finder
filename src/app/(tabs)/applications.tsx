import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, Screen } from '@/components';
import { spacing } from '@/theme';

export default function ApplicationsScreen() {
  return (
    <Screen scroll edges={['left', 'right']}>
      <View style={styles.stack}>
        <AppText variant="heading">My applications</AppText>
        <AppText color="textMuted">
          Your real applications and status filters arrive in a later phase.
        </AppText>
        <Card
          accessibilityLabel="Open sample application"
          onPress={() =>
            router.push({ pathname: '/applications/[id]', params: { id: 'sample-1' } })
          }
        >
          <AppText variant="subheading">Sample application</AppText>
          <AppText variant="caption">Status: Applied</AppText>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg,
  },
});
