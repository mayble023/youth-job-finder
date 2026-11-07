import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, FormAlert, Screen } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { spacing } from '@/theme';
import { getErrorKind, getErrorMessage } from '@/utils/errors';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<unknown>(null);

  // Saved at sign-up; the full profile from the database replaces this in Phase 6.
  const metadataName: unknown = user?.user_metadata?.full_name;
  const fullName = typeof metadataName === 'string' ? metadataName : null;

  // On success the auth guard sends the user back to the login screen.
  const performSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      setSignOutError(error);
      setIsSigningOut(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Log out?', 'You will need your email and password to log back in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: performSignOut },
    ]);
  };

  return (
    <Screen scroll edges={['left', 'right']}>
      <View style={styles.stack}>
        <Card>
          <AppText variant="subheading">{fullName ?? 'Your profile'}</AppText>
          {user?.email ? <AppText color="textMuted">{user.email}</AppText> : null}
          <AppText variant="caption">
            Town, skills and your CV will show here in a later phase.
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

        <FormAlert
          message={signOutError ? getErrorMessage(signOutError) : null}
          action={
            getErrorKind(signOutError) === 'network'
              ? { label: 'Retry', onPress: performSignOut, loading: isSigningOut }
              : undefined
          }
        />
        <Button
          title="Log out"
          icon="log-out-outline"
          variant="danger"
          onPress={confirmSignOut}
          loading={isSigningOut}
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
