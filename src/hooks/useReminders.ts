import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

import {
  configureReminders,
  getReminderPermission,
  getRemindersEnabled,
  openNotificationSettings,
  requestReminderPermission,
  setRemindersEnabled,
  subscribeToReminderTaps,
  syncInterviewReminders,
  type ReminderSource,
} from '@/services/reminders';

import { queryKeys } from './queryKeys';
import { useMyApplications } from './useApplications';

/** The on/off setting plus the notification permission, for the Profile toggle. */
export function useReminderSettings() {
  const queryClient = useQueryClient();

  const settings = useQuery({
    queryKey: queryKeys.reminderSettings,
    queryFn: async () => ({
      enabled: await getRemindersEnabled(),
      permission: await getReminderPermission(),
    }),
    // Reads the phone only, so it works offline. Always re-read when the app comes back to
    // the foreground, in case notifications were allowed in system settings meanwhile.
    networkMode: 'always',
    staleTime: 0,
  });

  const setEnabled = useMutation({
    mutationFn: async (enabled: boolean) => {
      // Ask for permission at the moment the user turns reminders on, when it makes sense.
      if (enabled) await requestReminderPermission();
      await setRemindersEnabled(enabled);
    },
    networkMode: 'always',
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.reminderSettings }),
  });

  return { settings, setEnabled, openSettings: openNotificationSettings };
}

/**
 * Keeps interview reminders in step with the user's applications and opens an application
 * when its reminder is tapped. Mount once, inside the signed-in part of the app.
 */
export function useInterviewReminders() {
  const queryClient = useQueryClient();
  const { data: applications } = useMyApplications();
  const { settings } = useReminderSettings();
  const isEnabled = settings.data?.enabled ?? false;
  // Prompt at most once per session; after that the Profile toggle is the way to allow it.
  const hasPrompted = useRef(false);

  useEffect(() => {
    void configureReminders();
    return subscribeToReminderTaps((applicationId) =>
      router.push({ pathname: '/applications/[id]', params: { id: applicationId } }),
    );
  }, []);

  // Any change to the list (new interview, new time, status change, withdrawal) re-syncs.
  useEffect(() => {
    if (!isEnabled || !applications) return;

    const sources: ReminderSource[] = applications.map((application) => ({
      applicationId: application.id,
      status: application.status,
      interviewAt: application.interview_at,
      jobTitle: application.job?.title ?? 'Your interview',
      company: application.job?.company ?? 'the employer',
    }));
    const hasUpcomingInterview = sources.some(
      (source) => source.status === 'interviewing' && source.interviewAt !== null,
    );

    let isCurrent = true;
    (async () => {
      // Only prompt once there is something worth reminding the user about.
      const shouldPrompt = hasUpcomingInterview && !hasPrompted.current;
      if (shouldPrompt) hasPrompted.current = true;
      const permission = shouldPrompt
        ? await requestReminderPermission()
        : await getReminderPermission();
      if (!isCurrent) return;
      if (permission.granted) await syncInterviewReminders(sources);
      void queryClient.invalidateQueries({ queryKey: queryKeys.reminderSettings });
    })().catch(() => undefined);

    return () => {
      isCurrent = false;
    };
  }, [applications, isEnabled, queryClient]);
}
