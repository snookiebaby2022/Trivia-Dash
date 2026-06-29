import type { PowerUpInventory, PowerUpType, Profile, Question } from '../types';
import { spendCoins } from './coins';

export const POWER_UP_COSTS: Record<PowerUpType, number> = {
  fiftyFifty: 40,
  extraTime: 30,
  skip: 50,
};

export const POWER_UP_AD_GRANT: PowerUpInventory = {
  fiftyFifty: 1,
  extraTime: 1,
  skip: 1,
};

export function defaultPowerUpInventory(): PowerUpInventory {
  return { fiftyFifty: 1, extraTime: 1, skip: 0 };
}

export function hasPowerUp(inv: PowerUpInventory | undefined, type: PowerUpType): boolean {
  return (inv?.[type] ?? 0) > 0;
}

export function consumePowerUp(profile: Profile, type: PowerUpType): Profile | null {
  const inv = profile.powerUps ?? defaultPowerUpInventory();
  if ((inv[type] ?? 0) <= 0) return null;
  return {
    ...profile,
    powerUps: { ...inv, [type]: inv[type] - 1 },
  };
}

export function buyPowerUpWithCoins(profile: Profile, type: PowerUpType): Profile | null {
  const cost = POWER_UP_COSTS[type];
  const spent = spendCoins(profile, cost);
  if (!spent) return null;
  const inv = spent.powerUps ?? defaultPowerUpInventory();
  return { ...spent, powerUps: { ...inv, [type]: inv[type] + 1 } };
}

export function grantPowerUpPack(profile: Profile): Profile {
  const inv = profile.powerUps ?? defaultPowerUpInventory();
  return {
    ...profile,
    powerUps: {
      fiftyFifty: inv.fiftyFifty + POWER_UP_AD_GRANT.fiftyFifty,
      extraTime: inv.extraTime + POWER_UP_AD_GRANT.extraTime,
      skip: inv.skip + POWER_UP_AD_GRANT.skip,
    },
  };
}

/** Remove two wrong options (keep correct + one wrong). */
export function applyFiftyFifty(q: Question): number[] {
  const wrong = q.options
    .map((_, i) => i)
    .filter((i) => i !== q.answer);
  const keepWrong = wrong[Math.floor(Math.random() * wrong.length)];
  return [q.answer, keepWrong].sort((a, b) => a - b);
}

export const EXTRA_TIME_MS = 5000;
