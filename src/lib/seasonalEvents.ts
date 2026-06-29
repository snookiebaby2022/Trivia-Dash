import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Category } from '../types';

export type EventTheme =
  | 'sci_fi'
  | 'retro_90s'
  | 'holiday'
  | 'sports_madness'
  | 'music_mania'
  | 'movie_magic'
  | 'food_fight'
  | 'animal_royal_rumble'
  | 'space_odyssey'
  | 'history_mystery'
  | 'anime_arena'
  | 'kpop_kingdom'
  | 'marvel_dc'
  | 'potterverse'
  | 'nature_power';

export interface SeasonalEvent {
  id: string;
  theme: EventTheme;
  title: string;
  subtitle: string;
  emoji: string;
  categories: Category[];
  startDate: string;
  endDate: string;
  entryCoins: number;
  prizeCoins: number;
  exclusiveReward: {
    type: 'frame' | 'badge' | 'title' | 'avatar';
    id: string;
    label: string;
  };
  questionCount: number;
  timeLimitMs: number;
}

export interface EventLeaderboardEntry {
  id: string;
  username: string;
  score: number;
  rank: number;
  isYou: boolean;
  completedAt?: number;
}

export interface EventResult {
  eventId: string;
  score: number;
  rank: number;
  totalPlayers: number;
  rewardEarned: boolean;
  coinsEarned: number;
}

const STORAGE_KEY = 'bb.seasonal_events.v1';

const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: 'evt_spring_scifi_2026',
    theme: 'sci_fi',
    title: 'Galactic Brain Blast',
    subtitle: 'Science fiction showdown',
    emoji: '🚀',
    categories: ['Science', 'Space', 'Technology'],
    startDate: '2026-03-20',
    endDate: '2026-03-27',
    entryCoins: 50,
    prizeCoins: 500,
    exclusiveReward: { type: 'frame', id: 'neon_cyber', label: 'Neon Cyber Frame' },
    questionCount: 15,
    timeLimitMs: 10000,
  },
  {
    id: 'evt_summer_sports_2026',
    theme: 'sports_madness',
    title: 'Summer Sports Mania',
    subtitle: 'Compete like a champion',
    emoji: '🏆',
    categories: ['Sports', 'History', 'Geography'],
    startDate: '2026-06-21',
    endDate: '2026-06-28',
    entryCoins: 75,
    prizeCoins: 750,
    exclusiveReward: { type: 'badge', id: 'gold_medal', label: 'Gold Medal Badge' },
    questionCount: 20,
    timeLimitMs: 8000,
  },
  {
    id: 'evt_fall_retro_2026',
    theme: 'retro_90s',
    title: '90s Throwdown',
    subtitle: 'Totally radical trivia',
    emoji: '📼',
    categories: ['Pop Culture', 'Music', 'Movies'],
    startDate: '2026-09-15',
    endDate: '2026-09-22',
    entryCoins: 50,
    prizeCoins: 500,
    exclusiveReward: { type: 'avatar', id: 'retro_player', label: 'Retro Disc Player' },
    questionCount: 15,
    timeLimitMs: 12000,
  },
  {
    id: 'evt_winter_holiday_2026',
    theme: 'holiday',
    title: 'Holiday Spectacular',
    subtitle: 'Festive knowledge showdown',
    emoji: '🎄',
    categories: ['History', 'Literature', 'Food', 'Music'],
    startDate: '2026-12-18',
    endDate: '2026-12-31',
    entryCoins: 100,
    prizeCoins: 1000,
    exclusiveReward: { type: 'title', id: 'holiday_hero', label: 'Holiday Hero' },
    questionCount: 25,
    timeLimitMs: 10000,
  },
  {
    id: 'evt_spring_anime_2027',
    theme: 'anime_arena',
    title: 'Anime Arena Clash',
    subtitle: 'East meets west trivia war',
    emoji: '⚔️',
    categories: ['Pop Culture', 'Art', 'Literature', 'Music'],
    startDate: '2027-04-01',
    endDate: '2027-04-08',
    entryCoins: 75,
    prizeCoins: 750,
    exclusiveReward: { type: 'frame', id: 'sakura_bloom', label: 'Sakura Bloom Frame' },
    questionCount: 20,
    timeLimitMs: 8000,
  },
];

const EVENT_THEMES: { theme: EventTheme; label: string; emoji: string; description: string }[] = [
  { theme: 'sci_fi', label: 'Sci-Fi', emoji: '🚀', description: 'Futuristic tech and space explorers' },
  { theme: 'retro_90s', label: '90s Retro', emoji: '📼', description: 'Totally radical throwback trivia' },
  { theme: 'holiday', label: 'Holiday', emoji: '🎄', description: 'Festive seasonal showdown' },
  { theme: 'sports_madness', label: 'Sports Mania', emoji: '🏆', description: 'Championship-level sports knowledge' },
  { theme: 'music_mania', label: 'Music Mania', emoji: '🎵', description: 'All about the rhythm and beats' },
  { theme: 'movie_magic', label: 'Movie Magic', emoji: '🎬', description: 'Lights, camera, trivia!' },
  { theme: 'food_fight', label: 'Food Fight', emoji: '🍕', description: 'Culinary knowledge showdown' },
  { theme: 'animal_royal_rumble', label: 'Animal Rumble', emoji: '🦁', description: 'Wild animal kingdom battle' },
  { theme: 'space_odyssey', label: 'Space Odyssey', emoji: '🌌', description: 'Journey through the cosmos' },
  { theme: 'history_mystery', label: 'History Mystery', emoji: '📜', description: 'Unravel the past' },
  { theme: 'anime_arena', label: 'Anime Arena', emoji: '⚔️', description: 'East meets west trivia war' },
  { theme: 'kpop_kingdom', label: 'K-Pop Kingdom', emoji: '🎤', description: 'Korean pop culture showdown' },
  { theme: 'marvel_dc', label: 'Marvel vs DC', emoji: '🦸', description: 'Superhero universe battle' },
  { theme: 'potterverse', label: 'Potterverse', emoji: '🧙', description: 'Magical wizarding world trivia' },
  { theme: 'nature_power', label: 'Nature Power', emoji: '🌿', description: 'Earth and wildlife knowledge' },
];

interface LeaderboardStore {
  [eventId: string]: EventLeaderboardEntry[];
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isEventActive(event: SeasonalEvent): boolean {
  const today = todayKey();
  return today >= event.startDate && today <= event.endDate;
}

export function getEventTimeRemaining(
  event: SeasonalEvent
): { days: number; hours: number; minutes: number } | null {
  if (!isEventActive(event)) return null;
  const end = new Date(event.endDate + 'T23:59:59');
  const now = Date.now();
  const diff = end.getTime() - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return { days, hours, minutes };
}

export function getActiveEvent(): SeasonalEvent | null {
  return SEASONAL_EVENTS.find((e) => isEventActive(e)) ?? null;
}

export function getUpcomingEvents(): SeasonalEvent[] {
  const today = todayKey();
  return SEASONAL_EVENTS.filter((e) => e.endDate >= today);
}

export function getEventById(id: string): SeasonalEvent | undefined {
  return SEASONAL_EVENTS.find((e) => e.id === id);
}

export function getNextEventStart(): Date | null {
  const today = todayKey();
  const upcoming = SEASONAL_EVENTS.filter((e) => e.startDate > today).sort(
    (a, b) => a.startDate.localeCompare(b.startDate)
  );
  return upcoming.length > 0 ? new Date(upcoming[0].startDate + 'T00:00:00') : null;
}

export function getEventThemes(): {
  theme: EventTheme;
  label: string;
  emoji: string;
  description: string;
}[] {
  return EVENT_THEMES;
}

async function loadLeaderboards(): Promise<LeaderboardStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LeaderboardStore;
  } catch {}
  return {};
}

async function saveLeaderboards(store: LeaderboardStore): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

function randomBotEntries(count: number, excludeName: string): EventLeaderboardEntry[] {
  const names = [
    'BrainiacBot', 'QuizWhiz42', 'TriviaTitan', 'KnowledgeKing', 'FactMaster',
    'WiseOwl99', 'SmartyPants', 'EinsteinJr', 'ProfBrain', 'NerdAlert',
    'ThinkFast', 'QuickDrawQ', 'PubTriviaPro', 'AnswerAce', 'FinalAnswerBot',
  ];
  const entries: EventLeaderboardEntry[] = [];
  const usedNames = new Set<string>([excludeName]);
  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      name = names[Math.floor(Math.random() * names.length)];
    } while (usedNames.has(name));
    usedNames.add(name);
    entries.push({
      id: `bot_${Math.random().toString(36).slice(2, 8)}`,
      username: name,
      score: Math.floor(Math.random() * 3000) + 500,
      rank: 0,
      isYou: false,
    });
  }
  return entries;
}

export async function submitEventScore(
  eventId: string,
  score: number,
  playerName: string
): Promise<EventResult> {
  const store = await loadLeaderboards();
  const existing = store[eventId] ?? [];
  const botEntries = randomBotEntries(20, playerName);
  const allEntries = [...existing, ...botEntries];

  allEntries.push({
    id: `player_${Date.now()}`,
    username: playerName,
    score,
    rank: 0,
    isYou: true,
    completedAt: Date.now(),
  });

  allEntries.sort((a, b) => b.score - a.score);
  allEntries.forEach((e, i) => (e.rank = i + 1));

  store[eventId] = allEntries;
  await saveLeaderboards(store);

  const playerEntry = allEntries.find((e) => e.isYou);
  const rank = playerEntry?.rank ?? allEntries.length;
  const totalPlayers = allEntries.length;
  const rewardEarned = rank <= 3;
  const coinsEarned = rewardEarned
    ? Math.round(
        (rank === 1 ? 1.0 : rank === 2 ? 0.75 : 0.5) *
          (getEventById(eventId)?.prizeCoins ?? 500)
      )
    : Math.round(score * 0.1);

  return { eventId, score, rank, totalPlayers, rewardEarned, coinsEarned };
}

export async function getEventLeaderboard(
  eventId: string
): Promise<EventLeaderboardEntry[]> {
  const store = await loadLeaderboards();
  return store[eventId] ?? [];
}
