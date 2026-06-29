import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetInfoState } from '@react-native-community/netinfo';

import { track } from './analytics';
import type { MatchSummary, Category } from '../types';

const QUEUE_KEY = 'bb.offline_queue.v1';
const MAX_QUEUED = 50;

export interface OfflineMatch {
  id: string;
  summary: MatchSummary;
  correctCategories: Category[];
  timestamp: number;
  synced: boolean;
}

let queue: OfflineMatch[] = [];
let isOnline = true;
let syncCallback: ((match: OfflineMatch) => Promise<boolean>) | null = null;

export async function initOfflineSync(
  onSync: (match: OfflineMatch) => Promise<boolean>
): Promise<void> {
  syncCallback = onSync;
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (raw) {
      queue = JSON.parse(raw);
    }
  } catch {
    queue = [];
  }
  void processQueue();
}

export function setOnlineStatus(online: boolean): void {
  const wasOffline = !isOnline;
  isOnline = online;
  if (wasOffline && isOnline) {
    void processQueue();
  }
}

export async function queueOfflineMatch(
  summary: MatchSummary,
  correctCategories: Category[]
): Promise<void> {
  const match: OfflineMatch = {
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    summary,
    correctCategories,
    timestamp: Date.now(),
    synced: false,
  };

  queue.push(match);
  if (queue.length > MAX_QUEUED) {
    queue = queue.filter((m) => !m.synced).slice(-MAX_QUEUED);
  }

  await persistQueue();

  if (isOnline) {
    void processQueue();
  }
}

async function processQueue(): Promise<void> {
  if (!syncCallback || !isOnline) return;

  const unsynced = queue.filter((m) => !m.synced);
  for (const match of unsynced) {
    try {
      const ok = await syncCallback(match);
      if (ok) {
        match.synced = true;
        track({ type: 'match_complete', mode: match.summary.mode, won: match.summary.outcome === 'win', score: match.summary.you, durationMs: 0, timestamp: match.timestamp });
      }
    } catch {
      // will retry next time
    }
  }

  await persistQueue();
}

async function persistQueue(): Promise<void> {
  try {
    const toStore = queue.filter((m) => !m.synced);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(toStore));
  } catch {
    // best effort
  }
}

export function getPendingSyncCount(): number {
  return queue.filter((m) => !m.synced).length;
}

export async function clearSyncedQueue(): Promise<void> {
  queue = queue.filter((m) => !m.synced);
  await persistQueue();
}
