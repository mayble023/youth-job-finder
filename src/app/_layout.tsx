import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LoadingState, Screen } from '@/components';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/services/queryClient';
import { stackScreenOptions } from '@/theme/navigation';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <LoadingState message="Getting things ready…" />
      </Screen>
    );
  }

  const isSignedIn = session !== null;

  // When a guard turns false (e.g. on log out) its screens are removed from history and the
  // router moves to the first screen the user is allowed to see.
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Protected guard={isSignedIn}>
        {/* Groups draw their own headers (auth Stack, tab headers). */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="jobs/[id]" options={{ title: 'Job details' }} />
        <Stack.Screen name="apply/[jobId]" options={{ title: 'Apply' }} />
        <Stack.Screen name="applications/[id]/index" options={{ title: 'Application' }} />
        <Stack.Screen name="applications/[id]/edit" options={{ title: 'Edit application' }} />
        <Stack.Screen name="profile/edit" options={{ title: 'Edit profile' }} />
        <Stack.Screen name="saved" options={{ title: 'Saved jobs' }} />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
