import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import type { Category } from '../types';
import { getCategoryTheme } from './categoryTheme';
import { formatCelebrationLine, speakLine } from './speech';
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

const HARVEY_STREAK_LINES: Record<number, string[]> = {
  3: ['Three on the board!', 'The crowd loves it!', 'You heating up now!'],
  5: ['Five straight answers!', 'Unstoppable!', 'That is a number one streak!'],
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

export function streakCelebration(
  streak: number,
  category?: Category,
  harveyStyle = false
): CelebrationPayload | null {
  if (streak === 3 || streak === 5) {
    const lines = harveyStyle ? HARVEY_STREAK_LINES[streak] : STREAK_LINES[streak];
    return {
      kind: streak === 5 ? 'streak_5' : 'streak_3',
      title: lines[streak === 5 ? 2 : 0],
      subtitle: harveyStyle ? `Survey says… ${streak} in a row!` : `${streak} correct in a row`,
      emoji: streak >= 5 ? '💥' : '🔥',
      color: '#FF6B4A',
    };
  }
  return null;
}

export function wedgeCelebration(category: Category, harveyStyle = false): CelebrationPayload {
  const theme = getCategoryTheme(category);
  return {
    kind: 'wedge',
    title: harveyStyle ? `${category} wedge — SURVEY SAYS!` : `${category} wedge!`,
    subtitle: harveyStyle ? 'That category is ON the board!' : 'Category locked in',
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
    void speakLine(formatCelebrationLine(`${payload.emoji} ${payload.title}`, voice.preset), voice);
  }
}
