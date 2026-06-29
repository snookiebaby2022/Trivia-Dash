import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AvatarConfig } from '../types';
import { getFriends } from './friends';
import { AVATAR_EMOJIS, AVATAR_COLORS } from './avatars';

export type FeedItemType =
  | 'friend_joined'
  | 'challenge_sent'
  | 'challenge_result'
  | 'daily_done'
  | 'streak_achieved'
  | 'achievement_unlock'
  | 'score_posted'
  | 'event_completed'
  | 'level_up';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  playerName: string;
  playerAvatar: AvatarConfig;
  friendId?: string;
  message: string;
  emoji: string;
  timestamp: number;
  actionLabel?: string;
  actionRoute?: string;
  score?: number;
  metadata?: Record<string, string | number>;
}

export interface DailyScoreComparison {
  friendId: string;
  friendName: string;
  friendAvatar: AvatarConfig;
  friendScore: number;
  yourScore: number;
  friendRank: number;
  totalPlayers: number;
  isYou: boolean;
}

const STORAGE_KEY = 'bb.social_feed.v1';
const MAX_ITEMS = 50;
const DEFAULT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

let feed: FeedItem[] = [];

export async function initSocialFeed(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) feed = JSON.parse(raw);
  } catch {
    feed = [];
  }
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(feed.slice(0, MAX_ITEMS)));
  } catch {
    // best effort
  }
}

export function getSocialFeed(limit = 20): FeedItem[] {
  return [...feed]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export function addFeedItem(item: Omit<FeedItem, 'id' | 'timestamp'>): void {
  const entry: FeedItem = {
    ...item,
    id: `feed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };
  feed.unshift(entry);
  if (feed.length > MAX_ITEMS) feed = feed.slice(0, MAX_ITEMS);
  void persist();
}

export function generateDailyFriendScores(
  yourId: string,
  yourScore: number,
): DailyScoreComparison[] {
  const friends = getFriends();
  const allPlayers: DailyScoreComparison[] = [
    {
      friendId: yourId,
      friendName: 'You',
      friendAvatar: { emoji: '🦊', color: '#FF6B4A', frame: 'classic', badge: 'none' },
      friendScore: yourScore,
      yourScore,
      friendRank: 0,
      totalPlayers: friends.length + 1,
      isYou: true,
    },
  ];

  for (const f of friends) {
    const delta = Math.floor(Math.random() * 3000) - 1400;
    const score = Math.max(0, yourScore + delta);
    allPlayers.push({
      friendId: f.id,
      friendName: f.username,
      friendAvatar: f.avatar,
      friendScore: score,
      yourScore,
      friendRank: 0,
      totalPlayers: friends.length + 1,
      isYou: false,
    });
  }

  allPlayers.sort((a, b) => b.friendScore - a.friendScore);
  allPlayers.forEach((p, i) => {
    p.friendRank = i + 1;
  });

  return allPlayers;
}

const MOCK_NAMES = [
  'Alex', 'Jordan', 'Sam', 'Riley', 'Casey', 'Morgan', 'Taylor', 'Quinn',
  'Avery', 'Drew', 'Blake', 'Hayden', 'Skyler', 'Dakota', 'Reese', 'Finley',
  'Parker', 'Rowan', 'Sage', 'Emerson',
];

const FEED_EMOJIS: Record<FeedItemType, string> = {
  friend_joined: '👋',
  challenge_sent: '⚔️',
  challenge_result: '🏆',
  daily_done: '📅',
  streak_achieved: '🔥',
  achievement_unlock: '🏅',
  score_posted: '🎯',
  event_completed: '🎉',
  level_up: '⬆️',
};

const FEED_VERBS: Record<FeedItemType, (name: string, meta?: Record<string, string | number>) => string> = {
  friend_joined: (n) => `${n} joined the game!`,
  challenge_sent: (n) => `${n} sent you a challenge`,
  challenge_result: (n, m) => `${n} ${m?.outcome === 'win' ? 'beat you' : 'lost to you'} in a challenge`,
  daily_done: (n, m) => `${n} completed today's daily with a score of ${m?.score ?? '?'}`,
  streak_achieved: (n, m) => `${n} hit a ${m?.streak ?? '?'} day streak!`,
  achievement_unlock: (n, m) => `${n} unlocked "${m?.achievement ?? 'an achievement'}"`,
  score_posted: (n, m) => `${n} scored ${m?.score ?? '?'} in a match`,
  event_completed: (n, m) => `${n} finished "${m?.event ?? 'a seasonal event'}"`,
  level_up: (n, m) => `${n} reached level ${m?.level ?? '?'} in the season pass`,
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAvatar(): AvatarConfig {
  return {
    emoji: pick(AVATAR_EMOJIS),
    color: pick(AVATAR_COLORS),
    frame: pick(['classic', 'gold', 'silver', 'neon'] as const),
    badge: pick(['none', 'crown', 'star', 'fire', 'bolt', 'gem', 'trophy', 'party'] as const),
  };
}

function randomRecentTime(maxAgeMs = 24 * 60 * 60 * 1000): number {
  return Date.now() - Math.floor(Math.random() * maxAgeMs);
}

export function generateFriendActivity(): FeedItem[] {
  const items: FeedItem[] = [];
  const types: FeedItemType[] = [
    'friend_joined', 'challenge_sent', 'challenge_result', 'daily_done',
    'streak_achieved', 'achievement_unlock', 'score_posted', 'event_completed', 'level_up',
  ];

  const achievements = [
    'First Win', 'On a Roll', 'Trivia Regular', 'Streak Master',
    'Perfect Score', 'Daily Devotee', 'Party Animal', 'Speed Demon',
  ];
  const events = ['Sci-Fi Showdown', '90s Nostalgia', 'Music Mania', 'Food Fight', 'Space Odyssey'];

  for (let i = 0; i < 15; i++) {
    const type = pick(types);
    const name = pick(MOCK_NAMES);
    const score = Math.floor(Math.random() * 9500) + 500;
    const streak = Math.floor(Math.random() * 30) + 3;
    const level = Math.floor(Math.random() * 25) + 2;
    const meta: Record<string, string | number> = {};

    if (type === 'challenge_result') meta.outcome = Math.random() > 0.5 ? 'win' : 'loss';
    if (type === 'daily_done' || type === 'score_posted') meta.score = score;
    if (type === 'streak_achieved') meta.streak = streak;
    if (type === 'achievement_unlock') meta.achievement = pick(achievements);
    if (type === 'event_completed') meta.event = pick(events);
    if (type === 'level_up') meta.level = level;

    items.push({
      id: `mock_${Date.now()}_${i}`,
      type,
      playerName: name,
      playerAvatar: randomAvatar(),
      friendId: `friend_${name.toLowerCase()}`,
      message: FEED_VERBS[type](name, meta),
      emoji: FEED_EMOJIS[type],
      timestamp: randomRecentTime(),
      score: type === 'score_posted' || type === 'daily_done' ? score : undefined,
      metadata: meta,
      ...(type === 'challenge_sent' ? { actionLabel: 'Accept Challenge', actionRoute: '/challenge/accept' } : {}),
      ...(type === 'score_posted' ? { actionLabel: 'Play Now', actionRoute: '/play' } : {}),
      ...(type === 'daily_done' ? { actionLabel: 'Play Daily', actionRoute: '/daily' } : {}),
    });
  }

  items.sort((a, b) => b.timestamp - a.timestamp);
  return items;
}

export function clearOldFeedItems(maxAgeMs = DEFAULT_MAX_AGE): void {
  const cutoff = Date.now() - maxAgeMs;
  feed = feed.filter((item) => item.timestamp > cutoff);
  void persist();
}

export function getPendingChallenges(): FeedItem[] {
  return feed.filter(
    (item) => item.type === 'challenge_sent' && item.actionLabel != null,
  );
}

export function getOnlineFriendsCount(): number {
  return Math.floor(Math.random() * 4) + 2;
}

export function markFeedItemRead(id: string): void {
  const idx = feed.findIndex((item) => item.id === id);
  if (idx >= 0) {
    delete feed[idx].actionLabel;
    delete feed[idx].actionRoute;
    void persist();
  }
}
