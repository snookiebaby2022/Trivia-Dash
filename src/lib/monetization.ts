import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AchievementState, AvatarBadge, AvatarFrame, Profile, VoicePreset } from '../types';
import { todayKey } from './daily';
import {
  clampVoicePackId,
  isPremiumVoicePack,
  PREMIUM_VOICE_COUNT,
} from './voiceCatalog';

const PRO_KEY = 'bb.pro.v1';
const MATCH_COUNT_KEY = 'bb.matches.v1';

import { RC_PRODUCT_MONTHLY, RC_PRODUCT_YEARLY } from './revenuecat';

/** Store product IDs — must match RevenueCat / Play Console (`monthly`, `yearly`). */
export const PRO_PRODUCT_ID = RC_PRODUCT_MONTHLY;
export const PRO_ANNUAL_ID = RC_PRODUCT_YEARLY;
export const PRO_PRICE_LABEL = '£3.49/mo';
export const PRO_ANNUAL_LABEL = '£19.99/yr';

export const ADMOB_BANNER_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/6300978111'
  : 'ca-app-pub-XXXXXXXX/YYYYYYYY';
export const ADMOB_INTERSTITIAL_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/1033173712'
  : 'ca-app-pub-XXXXXXXX/IIIIIIII';
export const ADMOB_REWARDED_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/5224354917'
  : 'ca-app-pub-XXXXXXXX/ZZZZZZZZ';

/** Show interstitial every N completed matches (after first session). */
export const INTERSTITIAL_EVERY_N_MATCHES = 5;

export { PREMIUM_VOICE_COUNT };

export const FREE_FRAMES: AvatarFrame[] = ['none', 'classic'];
export const PRO_FRAMES: AvatarFrame[] = ['gold', 'silver', 'neon', 'star'];

export const FREE_BADGES: AvatarBadge[] = ['none', 'star', 'fire'];
export const PRO_BADGES: AvatarBadge[] = ['crown', 'bolt', 'gem', 'trophy', 'party'];

export type RewardedPlacement = 'daily_retry' | 'streak_shield';

export function proFeaturesLabel(): string {
  return 'Unlock everything — full archive · no ads · all voices · all cosmetics';
}

export function isVoiceProLocked(preset: VoicePreset, isPro: boolean): boolean {
  return !isPro && isPremiumVoicePack(preset);
}

export function isFrameProLocked(frame: AvatarFrame, isPro: boolean): boolean {
  return !isPro && PRO_FRAMES.includes(frame);
}

export function isBadgeProLocked(badge: AvatarBadge, isPro: boolean): boolean {
  return !isPro && PRO_BADGES.includes(badge);
}

export function isFrameAvailable(
  frame: AvatarFrame,
  isPro: boolean,
  unlocks?: AchievementState['cosmeticUnlocks']
): boolean {
  if (FREE_FRAMES.includes(frame)) return true;
  if (unlocks?.frames.includes(frame)) return true;
  return isPro && PRO_FRAMES.includes(frame);
}

export function isBadgeAvailable(
  badge: AvatarBadge,
  isPro: boolean,
  unlocks?: AchievementState['cosmeticUnlocks']
): boolean {
  if (FREE_BADGES.includes(badge)) return true;
  if (unlocks?.badges.includes(badge)) return true;
  return isPro && PRO_BADGES.includes(badge);
}

export function isFrameLocked(
  frame: AvatarFrame,
  isPro: boolean,
  unlocks?: AchievementState['cosmeticUnlocks']
): boolean {
  return !isFrameAvailable(frame, isPro, unlocks);
}

export function isBadgeLocked(
  badge: AvatarBadge,
  isPro: boolean,
  unlocks?: AchievementState['cosmeticUnlocks']
): boolean {
  return !isBadgeAvailable(badge, isPro, unlocks);
}

export function clampVoicePreset(preset: VoicePreset, isPro: boolean): VoicePreset {
  return clampVoicePackId(preset, isPro);
}

export async function loadProStatus(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(PRO_KEY);
    return raw === 'true';
  } catch {
    return false;
  }
}

export async function saveProStatus(isPro: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(PRO_KEY, isPro ? 'true' : 'false');
  } catch {
    // best effort
  }
}

export async function loadTotalMatchesPlayed(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(MATCH_COUNT_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export async function recordMatchCompleted(): Promise<number> {
  const next = (await loadTotalMatchesPlayed()) + 1;
  try {
    await AsyncStorage.setItem(MATCH_COUNT_KEY, String(next));
  } catch {
    // best effort
  }
  return next;
}

/** First session + Pro users never see interstitials. */
export function shouldShowInterstitial(isPro: boolean, totalMatches: number): boolean {
  if (isPro) return false;
  if (totalMatches <= 1) return false;
  return totalMatches % INTERSTITIAL_EVERY_N_MATCHES === 0;
}

export function canPlayDailyToday(profile: Profile): boolean {
  const today = todayKey();
  if (profile.lastDailyDate !== today) return true;
  return profile.dailyExtraPlayDate === today;
}

export function dailyStatusLabel(profile: Profile): string {
  const today = todayKey();
  if (profile.lastDailyDate !== today) return 'Ready · 10 questions';
  if (profile.dailyExtraPlayDate === today) return 'Bonus run unlocked · tap to play';
  return 'Completed today';
}

export function canUseStreakShieldAd(profile: Profile): boolean {
  return profile.dailyStreak > 0 && !profile.streakShield && !profile.isPro;
}

export function canUseDailyRetryAd(profile: Profile): boolean {
  const today = todayKey();
  return (
    !profile.isPro &&
    profile.lastDailyDate === today &&
    profile.dailyExtraPlayDate !== today
  );
}

export function applyDailyExtraPlay(profile: Profile): Partial<Profile> {
  return { dailyExtraPlayDate: todayKey() };
}

export function applyStreakShield(profile: Profile): Partial<Profile> {
  return { streakShield: true };
}

export function consumeDailyExtraPlay(profile: Profile): Partial<Profile> {
  if (profile.dailyExtraPlayDate === todayKey()) {
    return { dailyExtraPlayDate: undefined };
  }
  return {};
}
