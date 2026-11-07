import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// Expo only inlines EXPO_PUBLIC_ variables when they are read with this exact dot syntax.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase is not configured. Copy .env.example to .env, fill in EXPO_PUBLIC_SUPABASE_URL ' +
      'and EXPO_PUBLIC_SUPABASE_KEY (the publishable/anon key), then restart `npx expo start`.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // There is no browser URL to read a session from in a native app.
    detectSessionInUrl: false,
    // Stops two refreshes running at once when the app wakes from the background.
    lock: processLock,
  },
});

// Timers are paused while a mobile app is in the background, so the token is only
// refreshed while the app is in the foreground and refreshing resumes on return.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
