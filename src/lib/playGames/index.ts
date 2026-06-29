import { Platform } from 'react-native';
import * as PlayGames from 'expo-stores-games-services';

import type { AchievementId } from '../achievements';
import {
  GPGS_ACHIEVEMENT_IDS,
  configuredLeaderboardKeys,
  isPlayGamesConfigured,
  isValidPlayGamesId,
  LEADERBOARD_IDS,
  LEADERBOARD_TIME_SPANS,
  type PlayLeaderboardKey,
} from './config';

export {
  configuredLeaderboardKeys,
  hasLeaderboardIds,
  isPlayGamesConfigured,
  isValidPlayGamesId,
  LEADERBOARD_IDS,
  LEADERBOARD_LABELS,
  playGamesAppId,
  type PlayLeaderboardKey,
} from './config';

function isAndroidPlayGames(): boolean {
  return Platform.OS === 'android' && isPlayGamesConfigured();
}

export async function isPlayGamesSignedIn(): Promise<boolean> {
  if (!isAndroidPlayGames()) return false;
  try {
    return await PlayGames.isAuthenticated();
  } catch {
    return false;
  }
}

export async function ensurePlayGamesSignedIn(): Promise<boolean> {
  if (!isAndroidPlayGames()) return false;
  try {
    if (await PlayGames.isAuthenticated()) return true;
    await PlayGames.signIn();
    return await PlayGames.isAuthenticated();
  } catch (e) {
    console.warn('[playGames] sign-in failed', e);
    return false;
  }
}

export async function submitPlayGamesScores(score: number, maxComboStreak: number): Promise<void> {
  if (!isAndroidPlayGames()) return;
  const signedIn = await ensurePlayGamesSignedIn();
  if (!signedIn) return;

  const tasks: Promise<void>[] = [];
  const roundedScore = Math.round(score);

  if (LEADERBOARD_IDS.highestScore && isValidPlayGamesId(LEADERBOARD_IDS.highestScore) && roundedScore > 0) {
    tasks.push(PlayGames.submitScore(roundedScore, LEADERBOARD_IDS.highestScore));
  }
  if (LEADERBOARD_IDS.dashStreak && isValidPlayGamesId(LEADERBOARD_IDS.dashStreak) && maxComboStreak > 0) {
    tasks.push(PlayGames.submitScore(maxComboStreak, LEADERBOARD_IDS.dashStreak));
  }
  if (LEADERBOARD_IDS.weekly && isValidPlayGamesId(LEADERBOARD_IDS.weekly) && roundedScore > 0) {
    tasks.push(PlayGames.submitScore(roundedScore, LEADERBOARD_IDS.weekly));
  }

  await Promise.allSettled(tasks);
}

export async function showPlayLeaderboard(key: PlayLeaderboardKey): Promise<void> {
  if (!isAndroidPlayGames()) return;
  const id = LEADERBOARD_IDS[key];
  if (!id || !isValidPlayGamesId(id)) return;
  const signedIn = await ensurePlayGamesSignedIn();
  if (!signedIn) return;
  await PlayGames.showLeaderboard(id, LEADERBOARD_TIME_SPANS[key]);
}

export async function showPlayAchievements(): Promise<void> {
  if (!isAndroidPlayGames()) return;
  const signedIn = await ensurePlayGamesSignedIn();
  if (!signedIn) return;
  await PlayGames.showAchievements();
}

export async function syncPlayGamesAchievements(unlocked: AchievementId[]): Promise<void> {
  if (!isAndroidPlayGames() || unlocked.length === 0) return;
  const signedIn = await ensurePlayGamesSignedIn();
  if (!signedIn) return;

  for (const id of unlocked) {
    const gpgsId = GPGS_ACHIEVEMENT_IDS[id];
    if (!gpgsId) continue;
    try {
      await PlayGames.unlockAchievement(gpgsId);
    } catch (e) {
      console.warn('[playGames] unlock failed', id, e);
    }
  }
}

export async function syncPlayGamesAfterMatch(payload: {
  score: number;
  maxComboStreak: number;
  unlockedAchievementIds: AchievementId[];
}): Promise<void> {
  await submitPlayGamesScores(payload.score, payload.maxComboStreak);
  await syncPlayGamesAchievements(payload.unlockedAchievementIds);
}
