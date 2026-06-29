import type { AchievementId } from '../achievements';

export type PlayLeaderboardKey = 'highestScore' | 'dashStreak' | 'weekly';

/** Valid Play Games leaderboard / achievement IDs start with CgkI */
export function isValidPlayGamesId(id: string): boolean {
  const t = id.trim();
  if (!t || t.includes('xxxx') || t.includes('…')) return false;
  return /^CgkI[a-zA-Z0-9_-]{10,}$/.test(t);
}

function env(key: string): string {
  return (process.env[key] ?? '').trim();
}

export function isPlayGamesConfigured(): boolean {
  const appId = env('EXPO_PUBLIC_PLAY_GAMES_APP_ID');
  return /^\d{10,}$/.test(appId);
}

export function playGamesAppId(): string {
  return env('EXPO_PUBLIC_PLAY_GAMES_APP_ID');
}

export function hasLeaderboardIds(): boolean {
  return Object.values(LEADERBOARD_IDS).some(isValidPlayGamesId);
}

export function configuredLeaderboardKeys(): PlayLeaderboardKey[] {
  return (Object.keys(LEADERBOARD_IDS) as PlayLeaderboardKey[]).filter((k) =>
    isValidPlayGamesId(LEADERBOARD_IDS[k])
  );
}

export const LEADERBOARD_IDS: Record<PlayLeaderboardKey, string> = {
  highestScore: env('EXPO_PUBLIC_GPGS_LB_HIGHEST_SCORE'),
  dashStreak: env('EXPO_PUBLIC_GPGS_LB_DASH_STREAK'),
  weekly: env('EXPO_PUBLIC_GPGS_LB_WEEKLY'),
};

/** Mirrors expo-stores-games-services TimeSpan. */
export const PLAY_GAMES_TIME_SPAN = {
  DAILY: 0,
  WEEKLY: 1,
  ALL_TIME: 2,
} as const;

export const LEADERBOARD_LABELS: Record<PlayLeaderboardKey, string> = {
  highestScore: 'Highest Score',
  dashStreak: 'Longest Dash Streak',
  weekly: 'Weekly High Score',
};

export const LEADERBOARD_TIME_SPANS: Record<PlayLeaderboardKey, number> = {
  highestScore: PLAY_GAMES_TIME_SPAN.ALL_TIME,
  dashStreak: PLAY_GAMES_TIME_SPAN.ALL_TIME,
  weekly: PLAY_GAMES_TIME_SPAN.WEEKLY,
};

/** Map in-app achievements to Play Console achievement IDs (optional per entry). */
export const GPGS_ACHIEVEMENT_IDS: Partial<Record<AchievementId, string>> = {
  first_win: env('EXPO_PUBLIC_GPGS_ACH_FIRST_WIN'),
  wins_10: env('EXPO_PUBLIC_GPGS_ACH_WINS_10'),
  streak_5: env('EXPO_PUBLIC_GPGS_ACH_STREAK_5'),
  daily_7: env('EXPO_PUBLIC_GPGS_ACH_DAILY_7'),
  perfect_game: env('EXPO_PUBLIC_GPGS_ACH_PERFECT'),
};
