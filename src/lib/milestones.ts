import { rankTitle } from './elo';
import type { MatchSummary, MilestoneHit, Profile } from '../types';

export type MilestoneKind =
  | 'first_win'
  | 'wins_5'
  | 'wins_10'
  | 'wins_25'
  | 'wins_50'
  | 'streak_3'
  | 'streak_5'
  | 'streak_10'
  | 'rank_up'
  | 'perfect_game'
  | 'all_wedges'
  | 'daily_streak_7'
  | 'daily_streak_30'
  | 'party_champion'
  | 'quad_champion';

const WIN_THRESHOLDS = [5, 10, 25, 50] as const;
const STREAK_THRESHOLDS = [3, 5, 10] as const;
const DAILY_THRESHOLDS = [7, 30] as const;
function crossedThreshold(before: number, after: number, threshold: number): boolean {
  return before < threshold && after >= threshold;
}

function rankTier(elo: number): string {
  return rankTitle(elo).title;
}

export function detectMilestones(
  profile: Profile,
  summary: MatchSummary,
  next: {
    wins: number;
    streak: number;
    dailyStreak: number;
    newElo: number;
  }
): MilestoneHit[] {
  if (summary.outcome !== 'win') return [];

  const hits: MilestoneHit[] = [];
  const prevElo = summary.newElo - summary.eloDelta;

  if (profile.wins === 0 && next.wins === 1) {
    hits.push({ kind: 'first_win', label: 'First victory!', emoji: '🏆' });
  }

  for (const n of WIN_THRESHOLDS) {
    if (crossedThreshold(profile.wins, next.wins, n)) {
      hits.push({
        kind: `wins_${n}` as MilestoneKind,
        label: `${n} career wins!`,
        emoji: '🎯',
      });
    }
  }

  for (const n of STREAK_THRESHOLDS) {
    if (crossedThreshold(profile.streak, next.streak, n)) {
      hits.push({
        kind: `streak_${n}` as MilestoneKind,
        label: `${n}-win streak!`,
        emoji: '🔥',
      });
    }
  }

  for (const n of DAILY_THRESHOLDS) {
    if (crossedThreshold(profile.dailyStreak, next.dailyStreak, n)) {
      hits.push({
        kind: `daily_streak_${n}` as MilestoneKind,
        label: `${n}-day daily streak!`,
        emoji: '📅',
      });
    }
  }

  if (rankTier(prevElo) !== rankTier(next.newElo) && summary.mode !== 'daily') {
    hits.push({
      kind: 'rank_up',
      label: `Rank up — ${rankTitle(next.newElo).title}!`,
      emoji: '⬆️',
    });
  }

  const allCorrect =
    summary.rounds.length > 0 && summary.rounds.every((r) => r.correct);
  if (allCorrect) {
    hits.push({ kind: 'perfect_game', label: 'Perfect game!', emoji: '💯' });
  }

  const newWedges = summary.collectedWedges ?? [];
  for (const cat of newWedges) {
    hits.push({
      kind: 'all_wedges',
      label: `${cat} wedge earned!`,
      emoji: '🥧',
    });
  }

  if (summary.mode === 'party' && summary.partyRank === 1) {
    hits.push({ kind: 'party_champion', label: 'Party night champion!', emoji: '🎉' });
  }

  if (summary.mode === 'quad' && summary.partyRank === 1) {
    hits.push({ kind: 'quad_champion', label: '4-player showdown winner!', emoji: '👑' });
  }

  return hits;
}
