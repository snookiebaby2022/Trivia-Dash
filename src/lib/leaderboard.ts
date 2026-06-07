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

function mockBoard(profile: Profile): LeaderboardEntry[] {
  const bots: LeaderboardEntry[] = MOCK_NAMES.map((username, i) => ({
    id: `mock_${i}`,
    username,
    elo: 2400 - i * 95 - (i % 3) * 17,
    wins: 320 - i * 18,
    rank: 0,
    avatar: AVATAR_PRESETS[i % AVATAR_PRESETS.length],
  }));
  const all = [
    ...bots,
    {
      id: profile.id,
      username: profile.username + ' (you)',
      elo: profile.elo,
      wins: profile.wins,
      rank: 0,
      avatar: profile.avatar,
    },
  ];
  all.sort((a, b) => b.elo - a.elo);
  all.forEach((e, i) => (e.rank = i + 1));
  return all;
}

export async function fetchLeaderboard(profile: Profile): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mockBoard(profile);
  }
  const { data, error } = await supabase
    .from('leaderboard')
    .select('id, username, elo, wins, avatar_emoji, avatar_color')
    .order('elo', { ascending: false })
    .limit(100);

  if (error || !data) {
    return mockBoard(profile);
  }
  return data.map((row, i) => ({
    id: row.id as string,
    username: row.username as string,
    elo: row.elo as number,
    wins: row.wins as number,
    rank: i + 1,
    avatar: normalizeAvatar({
      emoji: (row.avatar_emoji as string) || undefined,
      color: (row.avatar_color as string) || undefined,
    }),
  }));
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
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch {
    // best effort
  }
}
