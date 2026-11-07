import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { JobFiltersProvider } from '@/context/JobFiltersContext';
import { useInterviewReminders } from '@/hooks/useReminders';
import { colors } from '@/theme';
import { headerOptions } from '@/theme/navigation';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Outline icon in muted colour when inactive, filled primary icon when the tab is selected. */
function tabIcon(name: IconName, focusedName: IconName) {
  function TabIcon({ focused, size }: { focused: boolean; size: number }) {
    return (
      <Ionicons
        name={focused ? focusedName : name}
        color={focused ? colors.primary : colors.textMuted}
        size={size}
      />
    );
  }
  return TabIcon;
}

export default function TabsLayout() {
  // Mounted here because this layout only exists while the user is signed in.
  useInterviewReminders();

  // Shared so the Map tab shows the same jobs as the filtered Jobs list.
  return (
    <JobFiltersProvider>
      <Tabs
        screenOptions={{
          ...headerOptions,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Jobs', tabBarIcon: tabIcon('briefcase-outline', 'briefcase') }}
        />
        <Tabs.Screen
          name="map"
          options={{ title: 'Map', tabBarIcon: tabIcon('map-outline', 'map') }}
        />
        <Tabs.Screen
          name="applications"
          options={{
            title: 'Applications',
            tabBarIcon: tabIcon('document-text-outline', 'document-text'),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: 'Profile', tabBarIcon: tabIcon('person-outline', 'person') }}
        />
      </Tabs>
    </JobFiltersProvider>
  );
}
