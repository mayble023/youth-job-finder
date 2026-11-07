import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          // A solid background keeps the header opaque on iOS 26+ (Liquid Glass default is transparent).
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.onPrimary,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Component Demo' }} />
      </Stack>
    </>
  );
}
