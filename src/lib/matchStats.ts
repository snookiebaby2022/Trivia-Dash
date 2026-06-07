import type { AvatarConfig, Competitor, PlayerLiveStats, PlayerStatus } from '../types';
import { ROUND_TIME_MS } from './scoring';

export interface RoundStatInput {
  correct: boolean;
  ms: number;
  points: number;
}

export function initFromCompetitors(
  competitors: Competitor[],
  totalQuestions: number
): PlayerLiveStats[] {
  return rankStats(
    competitors.map((c) => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      isYou: c.isYou,
      isBot: c.isBot,
      score: c.score,
      correct: 0,
      answered: 0,
      totalQuestions,
      streak: 0,
      avgMs: 0,
      status: 'idle' as PlayerStatus,
      rank: 1,
    }))
  );
}

export function initDuel(
  you: { id: string; name: string; avatar: AvatarConfig },
  opponent: { id: string; name: string; avatar: AvatarConfig; isHuman: boolean },
  totalQuestions: number
): PlayerLiveStats[] {
  return rankStats([
    {
      id: you.id,
      name: you.name,
      avatar: you.avatar,
      isYou: true,
      isBot: false,
      score: 0,
      correct: 0,
      answered: 0,
      totalQuestions,
      streak: 0,
      avgMs: 0,
      status: 'idle',
      rank: 1,
    },
    {
      id: opponent.id,
      name: opponent.name,
      avatar: opponent.avatar,
      isYou: false,
      isBot: !opponent.isHuman,
      score: 0,
      correct: 0,
      answered: 0,
      totalQuestions,
      streak: 0,
      avgMs: 0,
      status: 'idle',
      rank: 2,
    },
  ]);
}

export function startRound(stats: PlayerLiveStats[]): PlayerLiveStats[] {
  return stats.map((s) => ({
    ...s,
    status: s.answered < s.totalQuestions ? 'thinking' : s.status,
  }));
}

export function applyResult(
  stats: PlayerLiveStats[],
  playerId: string,
  round: RoundStatInput
): PlayerLiveStats[] {
  const next = stats.map((s) => {
    if (s.id !== playerId) return s;
    const answered = s.answered + 1;
    const correct = s.correct + (round.correct ? 1 : 0);
    const streak = round.correct ? s.streak + 1 : 0;
    const totalMs = s.avgMs * s.answered + round.ms;
    const avgMs = answered > 0 ? Math.round(totalMs / answered) : 0;
    const timedOut = round.ms >= ROUND_TIME_MS && !round.correct;
    const status: PlayerStatus = timedOut ? 'timeout' : round.correct ? 'correct' : 'wrong';

    return {
      ...s,
      score: s.score + round.points,
      answered,
      correct,
      streak,
      avgMs,
      lastMs: round.ms,
      lastPoints: round.points,
      status,
    };
  });
  return rankStats(next);
}

export function mergeScore(
  stats: PlayerLiveStats[],
  playerId: string,
  score: number
): PlayerLiveStats[] {
  return rankStats(stats.map((s) => (s.id === playerId ? { ...s, score } : s)));
}

export function rankStats(stats: PlayerLiveStats[]): PlayerLiveStats[] {
  const sorted = [...stats].sort((a, b) => b.score - a.score || b.correct - a.correct);
  const rankMap = new Map<string, number>();
  sorted.forEach((s, i) => rankMap.set(s.id, i + 1));
  return stats.map((s) => ({ ...s, rank: rankMap.get(s.id) ?? stats.length }));
}

export function accuracy(stat: PlayerLiveStats): number {
  if (stat.answered === 0) return 0;
  return Math.round((stat.correct / stat.answered) * 100);
}

export function formatAvgMs(ms: number): string {
  if (ms <= 0) return '—';
  return `${(ms / 1000).toFixed(1)}s`;
}

export function statusLabel(status: PlayerStatus): string {
  switch (status) {
    case 'thinking':
      return 'Thinking…';
    case 'correct':
      return 'Correct';
    case 'wrong':
      return 'Wrong';
    case 'timeout':
      return 'Timed out';
    case 'answered':
      return 'Answered';
    default:
      return 'Ready';
  }
}

export function maxScore(stats: PlayerLiveStats[]): number {
  return Math.max(1, ...stats.map((s) => s.score));
}
