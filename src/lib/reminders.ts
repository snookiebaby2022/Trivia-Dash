import AsyncStorage from '@react-native-async-storage/async-storage';

import { todayKey } from './daily';
import type { Profile } from '../types';

const REMINDER_KEY = 'td.reminder.last';

/** In-app daily reminder — full push needs expo-notifications + rebuild. */
export async function shouldShowDailyReminder(profile: Profile): Promise<boolean> {
  if (profile.stats.dailyReminderEnabled === false) return false;
  const last = await AsyncStorage.getItem(REMINDER_KEY);
  const today = todayKey();
  if (last === today) return false;
  if (profile.lastDailyDate === today) return false;
  return true;
}

export async function dismissDailyReminder(): Promise<void> {
  await AsyncStorage.setItem(REMINDER_KEY, todayKey());
}
