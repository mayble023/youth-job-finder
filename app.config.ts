import type { ConfigContext, ExpoConfig } from 'expo/config';

// Same value as colors.primary in src/theme. Repeated here because the app config is read
// by the Expo CLI in Node, before any app code runs.
const BRAND_BLUE = '#0B4F9C';

const BRAND_ICON_FOREGROUND = './assets/images/android-icon-foreground.png';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Youth Job Finder',
  slug: 'youth-job-finder',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'youthjobfinder',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
  },
  android: {
    package: 'com.mayblewillie.youthjobfinder',
    // Starting point only: eas.json uses appVersionSource "remote", so EAS keeps the real
    // versionCode on its servers and increases it on every production build.
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: BRAND_ICON_FOREGROUND,
      backgroundColor: BRAND_BLUE,
    },
    predictiveBackGestureEnabled: false,
    // Only what the app uses: location for "jobs near me" and distances, notifications for
    // interview reminders (RECEIVE_BOOT_COMPLETED keeps them scheduled after a restart).
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'POST_NOTIFICATIONS',
      'RECEIVE_BOOT_COMPLETED',
    ],
    // Removed even if a library asks for them. The CV picker uses the system file picker,
    // so no storage permission is needed, and location is only used while the app is open.
    blockedPermissions: [
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.RECORD_AUDIO',
      'android.permission.SYSTEM_ALERT_WINDOW',
    ],
  },
  web: {
    output: 'server',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: BRAND_BLUE,
        image: BRAND_ICON_FOREGROUND,
        imageWidth: 200,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Youth Job Finder uses your location to show jobs near you and how far away they are.',
        isAndroidBackgroundLocationEnabled: false,
        isAndroidForegroundServiceEnabled: false,
      },
    ],
    [
      'react-native-maps',
      {
        // Read from .env locally and from EAS environment variables on the build server.
        // Expo Go has its own key, so this only matters for the APK/AAB.
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    ],
    '@react-native-community/datetimepicker',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      // Links this app to its EAS project. Not a secret.
      projectId: 'e0827e12-631c-4b24-9e7f-12428b248a76',
    },
  },
});
