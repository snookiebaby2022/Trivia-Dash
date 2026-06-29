import type { LeaderboardEntry, Profile } from '../types';
import { AVATAR_PRESETS, normalizeAvatar } from './avatars';
import { isSupabaseConfigured, supabase } from './supabase';

const MOCK_NAMES = [
  'QuizKing',
  'BrainStorm',
  'TriviaQueen',
  'FactMaster',
  'SmartyPants',
  'TheOracle',
  'MindBender',
  'KnowItAll',
  'Einstein2',
  'WiseOwl',
  'PuzzlePro',
  'GeniusGus',
];

function mockBoard(profile: Profile, byScore: boolean): LeaderboardEntry[] {
  const bots: LeaderboardEntry[] = MOCK_NAMES.map((username, i) => ({
    id: `mock_${i}`,
    username,
    elo: byScore ? 4200 - i * 180 : 2400 - i * 95 - (i % 3) * 17,
    wins: 320 - i * 18,
    rank: 0,
    avatar: AVATAR_PRESETS[i % AVATAR_PRESETS.length],
    bestMatchScore: byScore ? 4200 - i * 180 : undefined,
  }));
  const all = [
    ...bots,
    {
      id: profile.id,
      username: profile.username + ' (you)',
      elo: byScore ? (profile.stats.bestMatchScore ?? 0) : profile.elo,
      wins: profile.wins,
      rank: 0,
      avatar: profile.avatar,
      bestMatchScore: profile.stats.bestMatchScore,
    },
  ];
  all.sort((a, b) => (byScore ? (b.bestMatchScore ?? 0) - (a.bestMatchScore ?? 0) : b.elo - a.elo));
  all.forEach((e, i) => (e.rank = i + 1));
  return all;
}

function mapRow(
  row: Record<string, unknown>,
  i: number,
  mode: 'elo' | 'score'
): LeaderboardEntry {
  return {
    id: row.id as string,
    username: row.username as string,
    elo: row.elo as number,
    wins: row.wins as number,
    rank: i + 1,
    avatar: normalizeAvatar({
      emoji: (row.avatar_emoji as string) || undefined,
      color: (row.avatar_color as string) || undefined,
    }),
    bestMatchScore: (row.best_match_score as number) ?? 0,
    leaderboardMode: mode,
  };
}

/** Global top 100 by ELO rating. */
export async function fetchLeaderboard(profile: Profile): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mockBoard(profile, false);
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, elo, wins, avatar_emoji, avatar_color, best_match_score')
    .order('elo', { ascending: false })
    .limit(100);

  if (error || !data) {
    return mockBoard(profile, false);
  }
  return data.map((row, i) => mapRow(row, i, 'elo'));
}

/** Global top 100 by best single-match score. */
export async function fetchScoreLeaderboard(profile: Profile): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mockBoard(profile, true);
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, elo, wins, avatar_emoji, avatar_color, best_match_score')
    .gt('best_match_score', 0)
    .order('best_match_score', { ascending: false })
    .limit(100);

  if (error || !data) {
    return mockBoard(profile, true);
  }
  return data.map((row, i) => mapRow(row, i, 'score'));
}

export async function syncProfile(profile: Profile): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('profiles').upsert(
      {
        id: profile.id,
        username: profile.username,
        avatar_emoji: profile.avatar.emoji,
        avatar_color: profile.avatar.color,
        elo: profile.elo,
        wins: profile.wins,
        losses: profile.losses,
        draws: profile.draws,
        best_streak: profile.bestStreak,
        streak: profile.streak,
        is_pro: profile.isPro,
        daily_streak: profile.dailyStreak,
        last_daily_date: profile.lastDailyDate ?? null,
        best_match_score: profile.stats.bestMatchScore ?? 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch {
    // best effort
  }
}

/** Call after a match with the player's total points. */
export async function submitOnlineHighScore(profile: Profile, score: number): Promise<void> {
  if (!isSupabaseConfigured || !supabase || score <= 0) return;
  const best = Math.max(profile.stats.bestMatchScore ?? 0, score);
  if (best <= (profile.stats.bestMatchScore ?? 0)) {
    await syncProfile(profile);
    return;
  }
  await syncProfile({ ...profile, stats: { ...profile.stats, bestMatchScore: best } });
}
