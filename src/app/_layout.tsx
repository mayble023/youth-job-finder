import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { stackScreenOptions } from '@/theme/navigation';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={stackScreenOptions}>
        {/* Groups draw their own headers (auth Stack, tab headers). */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="jobs/[id]" options={{ title: 'Job details' }} />
        <Stack.Screen name="apply/[jobId]" options={{ title: 'Apply' }} />
        <Stack.Screen name="applications/[id]/index" options={{ title: 'Application' }} />
        <Stack.Screen name="applications/[id]/edit" options={{ title: 'Edit application' }} />
        <Stack.Screen name="profile/edit" options={{ title: 'Edit profile' }} />
        <Stack.Screen name="saved" options={{ title: 'Saved jobs' }} />
      </Stack>
    </>
  );
}
