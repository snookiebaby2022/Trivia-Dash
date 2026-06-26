import type { BotDifficulty } from '../types';

/** What free players get vs Unlock everything (Pro). */
export const ENTITLEMENTS = {
  free: {
    soloDifficulty: ['easy'] as BotDifficulty[],
    practicePlaysPerDay: 3,
    rankedMatch: false,
    pictureRounds: false,
    weeklyBonusXp: false,
    seasonPremiumTrack: false,
    hostFriendParty: false,
    liveHostMode: false,
    createUgcPacks: false,
    botTiersMediumUp: false,
  },
  pro: {
    soloDifficulty: ['easy', 'medium', 'hard', 'very_hard', 'unbeatable'] as BotDifficulty[],
    practicePlaysPerDay: Infinity,
    rankedMatch: true,
    pictureRounds: true,
    weeklyBonusXp: true,
    seasonPremiumTrack: true,
    hostFriendParty: true,
    liveHostMode: true,
    createUgcPacks: true,
    botTiersMediumUp: true,
  },
} as const;

export function allowedDifficulties(isPro: boolean): BotDifficulty[] {
  return isPro ? [...ENTITLEMENTS.pro.soloDifficulty] : [...ENTITLEMENTS.free.soloDifficulty];
}

export function isDifficultyLocked(difficulty: BotDifficulty, isPro: boolean): boolean {
  return !allowedDifficulties(isPro).includes(difficulty);
}

/** Ranked Quick Match is Pro-only. */
export function canUseRankedMatch(isPro: boolean): boolean {
  return isPro;
}

export function canHostParty(isPro: boolean): boolean {
  return isPro;
}

export function canCreateUgc(isPro: boolean): boolean {
  return isPro;
}

export function canUsePictureRounds(isPro: boolean): boolean {
  return isPro;
}

export function practiceLimit(isPro: boolean): number {
  return isPro ? ENTITLEMENTS.pro.practicePlaysPerDay : ENTITLEMENTS.free.practicePlaysPerDay;
}
