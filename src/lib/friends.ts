import AsyncStorage from '@react-native-async-storage/async-storage';
import { track } from './analytics';
import type { AvatarConfig } from '../types';

const FRIENDS_KEY = 'bb.friends.v1';
const ACTIVITY_KEY = 'bb.friend_activity.v1';
const MAX_ACTIVITY = 100;

export interface Friend {
  id: string;
  username: string;
  avatar: AvatarConfig;
  elo: number;
  wins: number;
  lastSeen: number;
  addedAt: number;
}

export interface FriendActivity {
  id: string;
  friendId: string;
  friendName: string;
  type: 'win' | 'rank_up' | 'achievement' | 'challenge' | 'daily_complete';
  message: string;
  timestamp: number;
}

interface FriendsStore {
  friends: Friend[];
}

let store: FriendsStore = { friends: [] };
let activity: FriendActivity[] = [];

export async function initFriends(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(FRIENDS_KEY);
    if (raw) store = JSON.parse(raw);
  } catch {
    store = { friends: [] };
  }
  try {
    const raw = await AsyncStorage.getItem(ACTIVITY_KEY);
    if (raw) activity = JSON.parse(raw);
  } catch {
    activity = [];
  }
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(store));
  } catch {
    // best effort
  }
}

async function persistActivity(): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity.slice(-MAX_ACTIVITY)));
  } catch {
    // best effort
  }
}

export function getFriends(): Friend[] {
  return [...store.friends].sort((a, b) => b.elo - a.elo);
}

export function getFriendCount(): number {
  return store.friends.length;
}

export function isFriend(id: string): boolean {
  return store.friends.some((f) => f.id === id);
}

export async function addFriend(friend: Omit<Friend, 'addedAt'>): Promise<boolean> {
  if (isFriend(friend.id)) return false;
  store.friends.push({ ...friend, addedAt: Date.now() });
  await persist();
  track({ type: 'friend_added', timestamp: Date.now() });
  addActivity({
    id: `act_${Date.now()}`,
    friendId: friend.id,
    friendName: friend.username,
    type: 'challenge',
    message: `${friend.username} was added as a friend`,
    timestamp: Date.now(),
  });
  return true;
}

export async function removeFriend(id: string): Promise<void> {
  store.friends = store.friends.filter((f) => f.id !== id);
  await persist();
}

export async function updateFriend(id: string, patch: Partial<Friend>): Promise<void> {
  const idx = store.friends.findIndex((f) => f.id === id);
  if (idx >= 0) {
    store.friends[idx] = { ...store.friends[idx], ...patch };
    await persist();
  }
}

export function getFriendLeaderboard(): Friend[] {
  return getFriends();
}

export function addActivity(entry: FriendActivity): void {
  activity.unshift(entry);
  if (activity.length > MAX_ACTIVITY) activity = activity.slice(0, MAX_ACTIVITY);
  void persistActivity();
}

export function getActivity(): FriendActivity[] {
  return [...activity];
}

export async function sendChallenge(friendId: string): Promise<boolean> {
  const friend = store.friends.find((f) => f.id === friendId);
  if (!friend) return false;
  track({ type: 'challenge_sent', timestamp: Date.now() });
  addActivity({
    id: `act_${Date.now()}`,
    friendId,
    friendName: friend.username,
    type: 'challenge',
    message: `Challenge sent to ${friend.username}`,
    timestamp: Date.now(),
  });
  return true;
}

export function getFriendIds(): string[] {
  return store.friends.map((f) => f.id);
}
