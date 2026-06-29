import type { Category, Profile } from '../types';

const CATEGORY_STREAK_KEY_PREFIX = 'bb.cat_streak.';

export interface CategoryStreak {
  category: Category;
  correct: number;
  bestStreak: number;
  bonusEarned: number;
}

/** Bonus coins for consecutive correct answers in the same category. */
export const CATEGORY_STREAK_BONUSES = [
  { threshold: 3, bonus: 10, label: '3 in a row!' },
  { threshold: 5, bonus: 25, label: '5 in a row!' },
  { threshold: 7, bonus: 50, label: '7 in a row!' },
  { threshold: 10, bonus: 100, label: '10 in a row! Unstoppable!' },
] as const;

export function calculateCategoryStreakBonus(
  category: Category,
  currentStreak: number
): { bonus: number; label: string } | null {
  for (let i = CATEGORY_STREAK_BONUSES.length - 1; i >= 0; i--) {
    const def = CATEGORY_STREAK_BONUSES[i];
    if (currentStreak === def.threshold) {
      return { bonus: def.bonus, label: def.label };
    }
  }
  return null;
}

export function getCategoryStreakKey(category: Category): string {
  return `${CATEGORY_STREAK_KEY_PREFIX}${category}`;
}

export function getNextStreakMilestone(currentStreak: number): number | null {
  for (const def of CATEGORY_STREAK_BONUSES) {
    if (def.threshold > currentStreak) return def.threshold;
  }
  return null;
}

export function streakProgressText(currentStreak: number): string {
  const next = getNextStreakMilestone(currentStreak);
  if (!next) return `${currentStreak} in a row — max streak!`;
  return `${currentStreak} in a row — ${next - currentStreak} more for bonus`;
}
