import type { AchievementId } from '../achievements';
import type { PlayLeaderboardKey } from './config';

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

export async function isPlayGamesSignedIn(): Promise<boolean> {
  return false;
}

export async function ensurePlayGamesSignedIn(): Promise<boolean> {
  return false;
}

export async function submitPlayGamesScores(_score: number, _maxComboStreak: number): Promise<void> {}

export async function showPlayLeaderboard(_key: PlayLeaderboardKey): Promise<void> {}

export async function showPlayAchievements(): Promise<void> {}

export async function syncPlayGamesAchievements(_unlocked: AchievementId[]): Promise<void> {}

export async function syncPlayGamesAfterMatch(_payload: {
  score: number;
  maxComboStreak: number;
  unlockedAchievementIds: AchievementId[];
}): Promise<void> {}
