import type { Category, Profile } from '../types';

export function bumpCategoryPlay(
  profile: Profile,
  category: Category,
  matchStreak: number
): Profile['stats'] {
  const plays = { ...profile.stats.categoryPlays };
  const prev = plays[category] ?? { plays: 0, bestStreak: 0 };
  plays[category] = {
    plays: prev.plays + 1,
    bestStreak: Math.max(prev.bestStreak, matchStreak),
  };
  return { ...profile.stats, categoryPlays: plays };
}

export function getCategoryPlayStats(profile: Profile, category: Category) {
  return profile.stats.categoryPlays[category] ?? { plays: 0, bestStreak: 0 };
}

export function canPracticeToday(profile: Profile, limit: number): boolean {
  if (!Number.isFinite(limit)) return true;
  const today = new Date().toISOString().slice(0, 10);
  if (profile.stats.practiceDay !== today) return true;
  return (profile.stats.practiceCountToday ?? 0) < limit;
}

export function consumePracticePlay(profile: Profile): Profile['stats'] {
  const today = new Date().toISOString().slice(0, 10);
  const day = profile.stats.practiceDay;
  const count = day === today ? (profile.stats.practiceCountToday ?? 0) + 1 : 1;
  return {
    ...profile.stats,
    practiceDay: today,
    practiceCountToday: count,
  };
}
