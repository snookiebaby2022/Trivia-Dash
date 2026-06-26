import AsyncStorage from '@react-native-async-storage/async-storage';

import { todayKey } from './daily';
import type { AvatarConfig, DailyLeaderboardEntry, Profile } from '../types';

const LB_KEY = 'td.daily.lb.v1';

interface StoredDailyLb {
  dateKey: string;
  entries: DailyLeaderboardEntry[];
}

const DEMO_NAMES = ['QuizKing', 'BrainBolt', 'WedgeHunter', 'DailyPro', 'TriviaFox', 'NightOwl'];

function demoAvatar(i: number): AvatarConfig {
  const emojis = ['🦊', '🦉', '🐺', '⭐', '🔥', '👑'];
  const colors = ['#7C5CFF', '#FF5C8A', '#3DDC97', '#FFD24D', '#06B6D4', '#F97316'];
  return { emoji: emojis[i % emojis.length], color: colors[i % colors.length], frame: 'classic', badge: 'none' };
}

function buildDemoBoard(dateKey: string, yourScore?: number, profile?: Profile): DailyLeaderboardEntry[] {
  const base: DailyLeaderboardEntry[] = DEMO_NAMES.map((username, i) => ({
    id: `demo_${i}`,
    username,
    score: 1200 - i * 87 + (dateKey.charCodeAt(8) % 40),
    avatar: demoAvatar(i),
  }));
  if (profile && yourScore != null) {
    const you: DailyLeaderboardEntry = {
      id: profile.id,
      username: profile.username,
      score: yourScore,
      avatar: profile.avatar,
      isYou: true,
    };
    base.push(you);
  }
  return base
    .sort((a, b) => b.score - a.score)
    .map((e, i) => ({ ...e, rank: i + 1 } as DailyLeaderboardEntry & { rank?: number }));
}

export async function submitDailyScore(profile: Profile, score: number): Promise<void> {
  const dateKey = todayKey();
  const raw = await AsyncStorage.getItem(LB_KEY);
  let stored: StoredDailyLb = raw
    ? (JSON.parse(raw) as StoredDailyLb)
    : { dateKey, entries: [] };
  if (stored.dateKey !== dateKey) {
    stored = { dateKey, entries: [] };
  }
  const existing = stored.entries.findIndex((e) => e.id === profile.id);
  const entry: DailyLeaderboardEntry = {
    id: profile.id,
    username: profile.username,
    score,
    avatar: profile.avatar,
    isYou: true,
  };
  if (existing >= 0) stored.entries[existing] = entry;
  else stored.entries.push(entry);
  await AsyncStorage.setItem(LB_KEY, JSON.stringify(stored));
}

export async function fetchDailyLeaderboard(profile: Profile): Promise<DailyLeaderboardEntry[]> {
  const dateKey = todayKey();
  const yourBest = profile.stats.dailyBests[dateKey];
  const raw = await AsyncStorage.getItem(LB_KEY);
  let entries: DailyLeaderboardEntry[] = [];
  if (raw) {
    const stored = JSON.parse(raw) as StoredDailyLb;
    if (stored.dateKey === dateKey) entries = stored.entries;
  }
  const merged = buildDemoBoard(dateKey, yourBest, profile);
  for (const e of entries) {
    if (!merged.some((m) => m.id === e.id)) merged.push(e);
  }
  return merged
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
    .map((e) => ({ ...e, isYou: e.id === profile.id }));
}
