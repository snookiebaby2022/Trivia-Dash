import { CATEGORY_LIST } from './categoryTheme';
import type { Category, Profile } from '../types';

export const WEDGE_UNLOCK_CORRECT = 50;

export function getCategoryCorrect(profile: Profile, cat: Category): number {
  return profile.stats.categoryCorrect[cat] ?? 0;
}

export function isWedgeEarned(profile: Profile, cat: Category): boolean {
  return getCategoryCorrect(profile, cat) >= WEDGE_UNLOCK_CORRECT;
}

export function getEarnedWedges(profile: Profile): Category[] {
  return CATEGORY_LIST.filter((cat) => isWedgeEarned(profile, cat));
}

export function getWedgeProgress(profile: Profile, cat: Category) {
  const raw = getCategoryCorrect(profile, cat);
  return {
    current: Math.min(raw, WEDGE_UNLOCK_CORRECT),
    target: WEDGE_UNLOCK_CORRECT,
    earned: raw >= WEDGE_UNLOCK_CORRECT,
  };
}

export function countEarnedWedges(profile: Profile): number {
  return getEarnedWedges(profile).length;
}
