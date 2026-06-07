import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import type { Category } from '../types';
import { getCategoryTheme } from './categoryTheme';
import { speakLine } from './speech';
import type { VoiceSettings } from './speech';

export type CelebrationKind = 'streak_3' | 'streak_5' | 'wedge' | 'photo_finish';

export interface CelebrationPayload {
  kind: CelebrationKind;
  title: string;
  subtitle?: string;
  emoji: string;
  color: string;
}

const STREAK_LINES: Record<number, string[]> = {
  3: ['Three in a row!', 'Heating up!', 'On fire!'],
  5: ['Five straight!', 'Unstoppable!', 'Legendary streak!'],
};

export async function hapticSuccess(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // best effort
  }
}

export async function hapticMilestone(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // best effort
  }
}

export function streakCelebration(streak: number, category?: Category): CelebrationPayload | null {
  if (streak === 3 || streak === 5) {
    const lines = STREAK_LINES[streak];
    return {
      kind: streak === 5 ? 'streak_5' : 'streak_3',
      title: lines[streak === 5 ? 2 : 0],
      subtitle: `${streak} correct in a row`,
      emoji: streak >= 5 ? '💥' : '🔥',
      color: '#FF6B4A',
    };
  }
  return null;
}

export function wedgeCelebration(category: Category): CelebrationPayload {
  const theme = getCategoryTheme(category);
  return {
    kind: 'wedge',
    title: `${category} wedge!`,
    subtitle: 'Category locked in',
    emoji: theme.icon,
    color: theme.fill,
  };
}

export async function announceCelebration(
  payload: CelebrationPayload,
  voice?: VoiceSettings
): Promise<void> {
  void hapticMilestone();
  if (voice?.enabled) {
    void speakLine(`${payload.emoji} ${payload.title}`, voice);
  }
}
