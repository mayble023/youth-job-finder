import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { formatDateTime } from '@/utils/format';

const CHANNEL_ID = 'interview-reminders';
const SCHEDULED_KEY = 'yjf:v1:scheduledReminders';
const ENABLED_KEY = 'yjf:v1:remindersEnabled';

const HOUR_MS = 60 * 60 * 1000;
const REMINDER_OFFSETS = [
  { beforeMs: 24 * HOUR_MS, title: 'Interview tomorrow' },
  { beforeMs: 2 * HOUR_MS, title: 'Interview in 2 hours' },
];

/** What the reminders need to know about one application. */
export type ReminderSource = {
  applicationId: string;
  status: string;
  /** ISO timestamp or null. */
  interviewAt: string | null;
  jobTitle: string;
  company: string;
};

/** Per application: which interview time was scheduled and the notification ids to cancel. */
type ScheduledMap = Record<string, { interviewAt: string; notificationIds: string[] }>;

export type ReminderPermission = { granted: boolean; canAskAgain: boolean };

// ---------------------------------------------------------------- setup

let isConfigured = false;

/**
 * Shows reminders even while the app is open, and creates the Android channel that lets
 * users control these notifications separately in system settings. Safe to call repeatedly.
 */
export async function configureReminders(): Promise<void> {
  if (isConfigured) return;
  isConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Interview reminders',
      description: 'Reminders 24 hours and 2 hours before your job interviews.',
      importance: AndroidImportance.HIGH,
    });
  }
}

// ---------------------------------------------------------------- permission

export async function getReminderPermission(): Promise<ReminderPermission> {
  const status = await Notifications.getPermissionsAsync();
  return { granted: status.granted, canAskAgain: status.canAskAgain };
}

/** Shows the system prompt only if the user has not answered it yet. */
export async function requestReminderPermission(): Promise<ReminderPermission> {
  const current = await getReminderPermission();
  if (current.granted || !current.canAskAgain) return current;
  const status = await Notifications.requestPermissionsAsync();
  return { granted: status.granted, canAskAgain: status.canAskAgain };
}

export async function openNotificationSettings(): Promise<void> {
  await Linking.openSettings();
}

// ---------------------------------------------------------------- on/off setting

export async function getRemindersEnabled(): Promise<boolean> {
  try {
    // On by default: an interview reminder is what most users expect.
    return (await AsyncStorage.getItem(ENABLED_KEY)) !== 'false';
  } catch {
    return true;
  }
}

export async function setRemindersEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false');
  if (!enabled) await clearAllReminders();
}

// ---------------------------------------------------------------- scheduling

async function loadScheduled(): Promise<ScheduledMap> {
  try {
    const raw = await AsyncStorage.getItem(SCHEDULED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return typeof parsed === 'object' && parsed !== null ? (parsed as ScheduledMap) : {};
  } catch {
    return {};
  }
}

async function saveScheduled(map: ScheduledMap): Promise<void> {
  await AsyncStorage.setItem(SCHEDULED_KEY, JSON.stringify(map));
}

async function cancelIds(notificationIds: string[]): Promise<void> {
  await Promise.all(
    notificationIds.map((id) =>
      // Already fired or already cancelled is fine.
      Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined),
    ),
  );
}

/** Schedules the 24 h and 2 h reminders, skipping any time already in the past. */
async function scheduleFor(source: ReminderSource, interviewAt: Date): Promise<string[]> {
  const now = Date.now();
  const ids: string[] = [];

  for (const offset of REMINDER_OFFSETS) {
    const fireAt = interviewAt.getTime() - offset.beforeMs;
    if (fireAt <= now) continue;
    ids.push(
      await Notifications.scheduleNotificationAsync({
        content: {
          title: offset.title,
          body: `${source.jobTitle} at ${source.company} – ${formatDateTime(interviewAt)}`,
          // Read when the user taps the notification, to open this application.
          data: { applicationId: source.applicationId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
          channelId: CHANNEL_ID,
        },
      }),
    );
  }
  return ids;
}

function wantsReminder(source: ReminderSource): source is ReminderSource & { interviewAt: string } {
  return (
    source.status === 'interviewing' &&
    source.interviewAt !== null &&
    new Date(source.interviewAt).getTime() > Date.now()
  );
}

// Runs one sync at a time, so two quick changes cannot schedule duplicate reminders.
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.catch(() => undefined);
  return next;
}

/**
 * Makes the scheduled reminders match the user's applications: schedules new interviews,
 * reschedules changed times, and cancels reminders for withdrawn applications or ones
 * that are no longer "interviewing". Returns how many applications have reminders.
 */
export function syncInterviewReminders(sources: ReminderSource[]): Promise<number> {
  return enqueue(async () => {
    const scheduled = await loadScheduled();
    const wanted = new Map(
      sources.filter(wantsReminder).map((source) => [source.applicationId, source]),
    );

    for (const [applicationId, entry] of Object.entries(scheduled)) {
      const source = wanted.get(applicationId);
      if (!source || source.interviewAt !== entry.interviewAt) {
        await cancelIds(entry.notificationIds);
        delete scheduled[applicationId];
      }
    }

    for (const [applicationId, source] of wanted) {
      if (scheduled[applicationId]) continue;
      const notificationIds = await scheduleFor(source, new Date(source.interviewAt));
      scheduled[applicationId] = { interviewAt: source.interviewAt, notificationIds };
    }

    await saveScheduled(scheduled);
    return Object.keys(scheduled).length;
  });
}

/** Cancels every interview reminder, e.g. on log out or when reminders are turned off. */
export function clearAllReminders(): Promise<void> {
  return enqueue(async () => {
    const scheduled = await loadScheduled();
    await Promise.all(Object.values(scheduled).map((entry) => cancelIds(entry.notificationIds)));
    await AsyncStorage.removeItem(SCHEDULED_KEY);
  });
}

// ---------------------------------------------------------------- taps

function applicationIdFrom(response: Notifications.NotificationResponse | null): string | null {
  const value: unknown = response?.notification.request.content.data?.applicationId;
  return typeof value === 'string' ? value : null;
}

// Module-level so a remount (e.g. log out and back in) does not replay an old tap.
const handledTapIds = new Set<string>();

/**
 * Calls `onTap` with the application id when the user taps a reminder, including the tap
 * that opened the app from closed. Returns an unsubscribe function.
 */
export function subscribeToReminderTaps(onTap: (applicationId: string) => void): () => void {
  const handle = (response: Notifications.NotificationResponse | null) => {
    const applicationId = applicationIdFrom(response);
    const responseId = response?.notification.request.identifier;
    if (!applicationId || !responseId || handledTapIds.has(responseId)) return;
    handledTapIds.add(responseId);
    onTap(applicationId);
  };

  Notifications.getLastNotificationResponseAsync()
    .then(handle)
    .catch(() => undefined);
  const subscription = Notifications.addNotificationResponseReceivedListener(handle);
  return () => subscription.remove();
}
