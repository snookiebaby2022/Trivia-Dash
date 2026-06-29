import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { track } from './analytics';
import type { Profile } from '../types';

const NOTIF_PREF_KEY = 'bb.notifications.v1';

export interface NotificationPreferences {
  enabled: boolean;
  dailyReminder: boolean;
  dailyReminderHour: number;
  dailyReminderMinute: number;
  streakAlert: boolean;
  friendChallenge: boolean;
  seasonMilestone: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: false,
  dailyReminder: true,
  dailyReminderHour: 19,
  dailyReminderMinute: 0,
  streakAlert: true,
  friendChallenge: true,
  seasonMilestone: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status === 'granted') {
    track({ type: 'push_notification_opt_in', timestamp: Date.now() });
    return true;
  }
  return false;
}

export async function loadNotificationPrefs(): Promise<NotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_PREF_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    // fall through
  }
  return DEFAULT_PREFS;
}

export async function saveNotificationPrefs(prefs: NotificationPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIF_PREF_KEY, JSON.stringify(prefs));
  } catch {
    // best effort
  }
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Trivia Dash',
      body: 'Your daily challenge is waiting! Keep your streak alive.',
      data: { type: 'daily_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function scheduleStreakAlert(streak: number): Promise<void> {
  if (streak < 2) return;

  const now = new Date();
  const trigger = new Date(now);
  trigger.setHours(20, 0, 0, 0);
  if (trigger <= now) trigger.setDate(trigger.getDate() + 1);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${streak}-day streak at risk!`,
      body: 'Play now to keep your streak alive.',
      data: { type: 'streak_alert' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
    },
  });
}

export async function scheduleSeasonMilestone(level: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Season Level ${level} reached!`,
      body: 'Claim your reward in the Season Pass.',
      data: { type: 'season_milestone' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
    },
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}

export function trackNotificationReceived(): void {
  track({ type: 'push_notification_received', timestamp: Date.now() });
}

export async function setupNotificationsForProfile(profile: Profile): Promise<void> {
  const prefs = await loadNotificationPrefs();
  if (!prefs.enabled) return;

  await cancelAllNotifications();

  if (prefs.dailyReminder) {
    await scheduleDailyReminder(prefs.dailyReminderHour, prefs.dailyReminderMinute);
  }

  if (prefs.streakAlert && profile.dailyStreak >= 2) {
    await scheduleStreakAlert(profile.dailyStreak);
  }
}
