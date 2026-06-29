import type { SeasonPassProgress, SeasonXpSnapshot } from '../types';
import { weekKey } from './weeklyEvent';

export const SEASON_LEVEL_COUNT = 100;
export const XP_PER_LEVEL = 1000;
export const WINS_PER_XP_GAIN = 10;
export const XP_LOSS_ON_DEFEAT = 100;

export interface SeasonTier {
  level: number;
  xpRequired: number;
  freeReward?: string;
  proReward?: string;
}

const FREE_REWARDS = ['Badge', 'Frame', 'Title', 'Sticker', 'XP boost'];
const PRO_REWARDS = ['Neon frame', 'Gold frame', 'Voice pack', 'Gem badge', 'Star frame', 'Party flair'];

function buildTiers(): SeasonTier[] {
  const tiers: SeasonTier[] = [];
  for (let level = 1; level <= SEASON_LEVEL_COUNT; level++) {
    const xpRequired = (level - 1) * XP_PER_LEVEL;
    tiers.push({
      level,
      xpRequired,
      freeReward: level % 5 === 0 ? `Season ${level} ${FREE_REWARDS[level % FREE_REWARDS.length]}` : level % 3 === 0 ? `Lv${level} badge` : undefined,
      proReward: level % 4 === 0 ? `Pro ${PRO_REWARDS[level % PRO_REWARDS.length]}` : level % 7 === 0 ? `Pro track Lv${level}` : undefined,
    });
  }
  return tiers;
}

const TIERS = buildTiers();

export function currentSeasonId(): string {
  return `season-${weekKey().slice(0, 4)}`;
}

export function defaultSeasonPass(): SeasonPassProgress {
  return {
    seasonId: currentSeasonId(),
    xp: 0,
    winsTowardXp: 0,
    claimedFree: [],
    claimedPro: [],
  };
}

export function ensureSeasonPass(progress?: SeasonPassProgress): SeasonPassProgress {
  const id = currentSeasonId();
  if (!progress || progress.seasonId !== id) {
    return { seasonId: id, xp: 0, winsTowardXp: 0, claimedFree: [], claimedPro: [] };
  }
  return { ...progress, winsTowardXp: progress.winsTowardXp ?? 0 };
}

export function seasonTiers(): SeasonTier[] {
  return TIERS;
}

export function addSeasonXp(progress: SeasonPassProgress, amount: number): SeasonPassProgress {
  const next = Math.max(0, progress.xp + amount);
  return { ...progress, xp: next };
}

export function seasonLevel(xp: number): number {
  let level = 1;
  for (const t of TIERS) {
    if (xp >= t.xpRequired) level = t.level;
  }
  return level;
}

/** XP awarded after every 10 wins — one level chunk at base tier. */
export function xpGainOnWinStreak(isPro: boolean): number {
  return isPro ? Math.round(XP_PER_LEVEL * 1.25) : XP_PER_LEVEL;
}

export interface SeasonXpProgress {
  level: number;
  xp: number;
  xpInLevel: number;
  xpToNextLevel: number;
}

export function seasonXpProgress(xp: number): SeasonXpProgress {
  const level = seasonLevel(xp);
  const floor = (level - 1) * XP_PER_LEVEL;
  const xpInLevel = xp - floor;
  const xpToNextLevel = level >= SEASON_LEVEL_COUNT ? 0 : XP_PER_LEVEL - xpInLevel;
  return { level, xp, xpInLevel, xpToNextLevel };
}

export interface SeasonXpResult {
  pass: SeasonPassProgress;
  xpDelta: number;
  leveledUp: boolean;
}

/** Win 10 games to earn XP; losses reduce XP and reset the win counter. */
export function applyMatchSeasonXp(
  progress: SeasonPassProgress,
  outcome: 'win' | 'loss' | 'draw',
  isPro: boolean
): SeasonXpResult {
  const before = seasonLevel(progress.xp);

  if (outcome === 'draw') {
    return { pass: progress, xpDelta: 0, leveledUp: false };
  }

  if (outcome === 'loss') {
    const pass = addSeasonXp({ ...progress, winsTowardXp: 0 }, -XP_LOSS_ON_DEFEAT);
    const after = seasonLevel(pass.xp);
    return { pass, xpDelta: pass.xp - progress.xp, leveledUp: after > before };
  }

  const winsTowardXp = (progress.winsTowardXp ?? 0) + 1;
  if (winsTowardXp < WINS_PER_XP_GAIN) {
    return {
      pass: { ...progress, winsTowardXp },
      xpDelta: 0,
      leveledUp: false,
    };
  }

  const gain = xpGainOnWinStreak(isPro);
  const pass = addSeasonXp({ ...progress, winsTowardXp: 0 }, gain);
  const after = seasonLevel(pass.xp);
  return { pass, xpDelta: gain, leveledUp: after > before };
}

/** Apply season XP and build the post-match popup snapshot. */
export function buildSeasonXpSnapshot(
  progress: SeasonPassProgress,
  outcome: 'win' | 'loss' | 'draw',
  isPro: boolean,
  wins: number,
  losses: number
): { pass: SeasonPassProgress; snapshot: SeasonXpSnapshot; xpGain: number } {
  const xpResult = applyMatchSeasonXp(progress, outcome, isPro);
  const prog = seasonXpProgress(xpResult.pass.xp);
  return {
    pass: xpResult.pass,
    xpGain: xpResult.xpDelta,
    snapshot: {
      ...prog,
      xpDelta: xpResult.xpDelta,
      wins,
      losses,
      winsTowardXp: xpResult.pass.winsTowardXp ?? 0,
      leveledUp: xpResult.leveledUp,
    },
  };
}

export function claimSeasonReward(
  progress: SeasonPassProgress,
  level: number,
  track: 'free' | 'pro',
  isPro: boolean
): { pass: SeasonPassProgress; coins: number } | null {
  const tier = TIERS.find((t) => t.level === level);
  if (!tier || progress.xp < tier.xpRequired) return null;

  if (track === 'free') {
    if (!tier.freeReward || progress.claimedFree.includes(level)) return null;
    return {
      pass: { ...progress, claimedFree: [...progress.claimedFree, level] },
      coins: 50 + level * 5,
    };
  }

  if (!isPro || !tier.proReward || progress.claimedPro.includes(level)) return null;
  return {
    pass: { ...progress, claimedPro: [...progress.claimedPro, level] },
    coins: 100 + level * 10,
  };
}

/** @deprecated use applyMatchSeasonXp */
export function xpForMatch(_correct: number, isPro: boolean, weeklyBonus = false): number {
  let xp = xpGainOnWinStreak(isPro);
  if (weeklyBonus && isPro) xp = Math.round(xp * 1.25);
  return xp;
}
