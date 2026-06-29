import type { Profile } from '../types';

/** Coins earned per correct answer (base, before combo). */
export const COINS_PER_CORRECT = 5;

/** Bonus coins for match win. */
export const COINS_MATCH_WIN = 25;

export function defaultPowerUps() {
  return { fiftyFifty: 1, extraTime: 1, skip: 0 };
}

export function addCoins(profile: Profile, amount: number): Profile {
  if (amount <= 0) return profile;
  return { ...profile, coins: (profile.coins ?? 0) + amount };
}

export function spendCoins(profile: Profile, amount: number): Profile | null {
  const bal = profile.coins ?? 0;
  if (bal < amount) return null;
  return { ...profile, coins: bal - amount };
}

export function formatCoins(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
