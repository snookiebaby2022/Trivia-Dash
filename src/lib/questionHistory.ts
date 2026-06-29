import type { ProfileStats } from '../types';

const MAX_RECENT = 100;

export function getRecentQuestionIds(stats?: ProfileStats): string[] {
  return stats?.recentQuestionIds ?? [];
}

export function mergeRecentQuestionIds(existing: string[] | undefined, seen: string[]): string[] {
  const merged = [...seen, ...(existing ?? [])];
  const out: string[] = [];
  for (const id of merged) {
    if (!out.includes(id)) out.push(id);
    if (out.length >= MAX_RECENT) break;
  }
  return out;
}
