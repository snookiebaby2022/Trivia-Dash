import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { MatchMode } from '../types';

const ANALYTICS_KEY = 'bb.analytics.v1';
const MAX_EVENTS = 500;

export type AnalyticsEvent =
  | { type: 'app_open'; timestamp: number }
  | { type: 'session_start'; timestamp: number; durationMs: number }
  | { type: 'match_start'; mode: MatchMode; timestamp: number }
  | { type: 'match_complete'; mode: MatchMode; won: boolean; score: number; durationMs: number; timestamp: number }
  | { type: 'daily_play'; timestamp: number }
  | { type: 'ad_watched'; placement: string; timestamp: number }
  | { type: 'ad_failed'; placement: string; error: string; timestamp: number }
  | { type: 'purchase_initiated'; product: string; timestamp: number }
  | { type: 'purchase_completed'; product: string; timestamp: number }
  | { type: 'purchase_failed'; product: string; error: string; timestamp: number }
  | { type: 'question_reported'; questionId: string; reason: string; timestamp: number }
  | { type: 'shop_purchase'; itemId: string; cost: number; timestamp: number }
  | { type: 'friend_added'; timestamp: number }
  | { type: 'challenge_sent'; timestamp: number }
  | { type: 'tournament_joined'; timestamp: number }
  | { type: 'tournament_completed'; placement: number; timestamp: number }
  | { type: 'share_card_shared'; timestamp: number }
  | { type: 'push_notification_opt_in'; timestamp: number }
  | { type: 'push_notification_received'; timestamp: number };

interface AnalyticsStore {
  events: AnalyticsEvent[];
  sessionStart?: number;
  installDate: string;
}

let store: AnalyticsStore = { events: [], installDate: new Date().toISOString().split('T')[0] };

export async function initAnalytics(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(ANALYTICS_KEY);
    if (raw) {
      store = JSON.parse(raw) as AnalyticsStore;
      if (!store.events) store.events = [];
    } else {
      await flushAnalytics();
    }
  } catch {
    // fresh store
  }
  track({ type: 'app_open', timestamp: Date.now() });
}

export function track(event: AnalyticsEvent): void {
  store.events.push(event);
  if (store.events.length > MAX_EVENTS) {
    store.events = store.events.slice(-MAX_EVENTS);
  }
  void flushAnalytics();
}

async function flushAnalytics(): Promise<void> {
  try {
    await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(store));
  } catch {
    // best effort
  }
}

export function startSession(): void {
  store.sessionStart = Date.now();
  track({ type: 'session_start', timestamp: Date.now(), durationMs: 0 });
}

export function endSession(): void {
  if (store.sessionStart) {
    track({ type: 'session_start', timestamp: Date.now(), durationMs: Date.now() - store.sessionStart });
    store.sessionStart = undefined;
  }
}

export function getInstallDate(): string {
  return store.installDate;
}

export function getRecentEvents(count: number = 50): AnalyticsEvent[] {
  return store.events.slice(-count);
}

export function getEventCount(type: AnalyticsEvent['type']): number {
  return store.events.filter((e) => e.type === type).length;
}

export function getSessionCount(): number {
  return store.events.filter((e) => e.type === 'session_start').length;
}

export function getTotalPlayTimeMs(): number {
  return store.events
    .filter((e): e is { type: 'session_start'; durationMs: number } & AnalyticsEvent => e.type === 'session_start' && 'durationMs' in e)
    .reduce((sum, e) => sum + e.durationMs, 0);
}

export function getPlatform(): string {
  return Platform.OS;
}
