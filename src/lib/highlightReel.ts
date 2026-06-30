import type { RoundResult } from '../types';

export type HighlightType =
  | 'clutch_correct'
  | 'speed_demon'
  | 'streak_milestone'
  | 'comeback'
  | 'perfect_round'
  | 'close_finish'
  | 'big_blunder'
  | 'dramatic_reveal'
  | 'unbreakable'
  | 'new_record';

export interface HighlightMoment {
  type: HighlightType;
  roundIndex: number;
  label: string;
  emoji: string;
  description: string;
  timestamp: number;
}

export interface HighlightReel {
  moments: HighlightMoment[];
  stats: {
    accuracy: number;
    avgSpeed: number;
    bestStreak: number;
    totalPoints: number;
    fastestAnswer: number;
    slowestAnswer: number;
  };
  shareText: string;
  shareEmoji: string;
}

const ROUND_TIME_MS = 10000;

const HIGHLIGHT_META: Record<
  HighlightType,
  { label: string; emoji: string; description: string }
> = {
  clutch_correct: {
    label: 'Clutch King',
    emoji: '🔥',
    description: 'Pulled off a correct answer under 3 seconds',
  },
  speed_demon: {
    label: 'Speed Demon',
    emoji: '⚡',
    description: 'Answered in under 1 second flat',
  },
  streak_milestone: {
    label: 'On Fire',
    emoji: '🔥',
    description: 'Hit a hot streak',
  },
  comeback: {
    label: 'Comeback Kid',
    emoji: '💪',
    description: 'Was behind and took the lead',
  },
  perfect_round: {
    label: 'Perfect Round',
    emoji: '✨',
    description: 'Nailed every single question',
  },
  close_finish: {
    label: 'Photo Finish',
    emoji: '🎯',
    description: 'Won by less than 100 points',
  },
  big_blunder: {
    label: 'Big Blunder',
    emoji: '😬',
    description: 'Ran out of time with all options showing',
  },
  dramatic_reveal: {
    label: 'Dramatic Reveal',
    emoji: '🎭',
    description: 'The last question flipped the outcome',
  },
  unbreakable: {
    label: 'Unbreakable',
    emoji: '🛡️',
    description: 'Survived 3+ wrong answers and kept going',
  },
  new_record: {
    label: 'New Record',
    emoji: '🏅',
    description: 'Beat your personal best score',
  },
};

export function captureMoment(
  type: HighlightType,
  roundIndex: number,
  context?: { ms?: number; streak?: number; score?: number; opponentScore?: number }
): HighlightMoment {
  const meta = HIGHLIGHT_META[type];
  let description = meta.description;
  if (type === 'streak_milestone' && context?.streak) {
    description = `Hit a ${context.streak}-answer streak!`;
  }
  if (type === 'clutch_correct' && context?.ms != null) {
    description = `Correct with ${(context.ms / 1000).toFixed(1)}s left`;
  }
  if (type === 'speed_demon' && context?.ms != null) {
    description = `Blazed through in ${(context.ms / 1000).toFixed(2)}s`;
  }
  return {
    type,
    roundIndex,
    label: meta.label,
    emoji: meta.emoji,
    description,
    timestamp: Date.now(),
  };
}

function detectMoments(rounds: RoundResult[]): HighlightMoment[] {
  const moments: HighlightMoment[] = [];
  let currentStreak = 0;
  let bestStreak = 0;
  let wrongCount = 0;

  for (let i = 0; i < rounds.length; i++) {
    const r = rounds[i];

    if (r.correct) {
      currentStreak++;
      if (currentStreak > bestStreak) bestStreak = currentStreak;
      wrongCount = 0;

      if (r.ms > ROUND_TIME_MS - 3000) {
        moments.push(captureMoment('clutch_correct', i, { ms: r.ms }));
      }
      if (r.ms < 1000) {
        moments.push(captureMoment('speed_demon', i, { ms: r.ms }));
      }
      if ([3, 5, 7, 10].includes(currentStreak)) {
        moments.push(
          captureMoment('streak_milestone', i, { streak: currentStreak })
        );
      }
    } else {
      if (r.selected === null && r.ms >= ROUND_TIME_MS) {
        moments.push(captureMoment('big_blunder', i));
      }
      wrongCount++;
      currentStreak = 0;
      if (wrongCount >= 3) {
        moments.push(captureMoment('unbreakable', i));
      }
    }
  }

  return moments;
}

function detectOutcomeFlip(
  rounds: RoundResult[],
  finalScore: number,
  opponentScore: number
): HighlightMoment[] {
  const moments: HighlightMoment[] = [];
  if (rounds.length === 0) return moments;

  let playerRunning = 0;
  let opponentRunning = 0;
  let playerWasBehind = false;

  for (let i = 0; i < rounds.length; i++) {
    const r = rounds[i];
    playerRunning += r.points;
    opponentRunning += Math.round(opponentScore / rounds.length);

    if (!playerWasBehind && playerRunning < opponentRunning) {
      playerWasBehind = true;
    }
    if (playerWasBehind && playerRunning > opponentRunning) {
      moments.push(captureMoment('comeback', i));
      playerWasBehind = false;
    }
  }

  const lastRound = rounds[rounds.length - 1];
  if (lastRound) {
    const prevPlayer = finalScore - lastRound.points;
    const prevOpponent = opponentScore - Math.round(opponentScore / rounds.length);
    const playerWasWinning = prevPlayer > prevOpponent;
    const playerNowWinning = finalScore > opponentScore;
    if (playerWasWinning !== playerNowWinning) {
      moments.push(captureMoment('dramatic_reveal', rounds.length - 1));
    }
  }

  return moments;
}

function computeStats(rounds: RoundResult[]): HighlightReel['stats'] {
  const correct = rounds.filter((r) => r.correct);
  const allMs = rounds.map((r) => r.ms).filter((ms) => ms > 0);
  return {
    accuracy: rounds.length > 0 ? Math.round((correct.length / rounds.length) * 100) : 0,
    avgSpeed: allMs.length > 0 ? Math.round(allMs.reduce((a, b) => a + b, 0) / allMs.length) : 0,
    bestStreak: computeBestStreak(rounds),
    totalPoints: rounds.reduce((sum, r) => sum + r.points, 0),
    fastestAnswer: allMs.length > 0 ? Math.min(...allMs) : 0,
    slowestAnswer: allMs.length > 0 ? Math.max(...allMs) : 0,
  };
}

function computeBestStreak(rounds: RoundResult[]): number {
  let best = 0;
  let current = 0;
  for (const r of rounds) {
    if (r.correct) {
      current++;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }
  return best;
}

function dominantEmoji(moments: HighlightMoment[]): string {
  if (moments.length === 0) return '🧠';
  const counts: Record<string, number> = {};
  for (const m of moments) {
    counts[m.emoji] = (counts[m.emoji] || 0) + 1;
  }
  let best = '';
  let bestCount = 0;
  for (const [emoji, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = emoji;
      bestCount = count;
    }
  }
  return best || '🧠';
}

function buildShareText(
  stats: HighlightReel['stats'],
  outcome: 'win' | 'loss' | 'draw',
  opponentScore: number
): { shareText: string; shareEmoji: string } {
  const correctStr = `${stats.accuracy}%`;
  const pointsStr = `${stats.totalPoints}`;
  const diff = stats.totalPoints - opponentScore;

  let outcomeLine: string;
  if (outcome === 'win') {
    outcomeLine = `Beat opponent by ${diff}!`;
  } else if (outcome === 'draw') {
    outcomeLine = 'Tied the match!';
  } else {
    outcomeLine = `Lost by ${Math.abs(diff)} points`;
  }

  const shareText = `🔥 ${correctStr} accuracy · ${pointsStr} pts · ${outcomeLine} Can you do better?`;
  const shareEmoji = stats.bestStreak >= 5 ? '🔥' : stats.accuracy >= 80 ? '✨' : '🧠';

  return { shareText, shareEmoji };
}

export function buildHighlightReel(
  rounds: RoundResult[],
  finalScore: number,
  opponentScore: number,
  outcome: 'win' | 'loss' | 'draw'
): HighlightReel {
  const allMoments = [
    ...detectMoments(rounds),
    ...detectOutcomeFlip(rounds, finalScore, opponentScore),
  ];

  const uniqueMoments: HighlightMoment[] = [];
  const seen = new Set<string>();
  for (const m of allMoments) {
    const key = `${m.type}_${m.roundIndex}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueMoments.push(m);
    }
  }

  uniqueMoments.sort((a, b) => {
    const priority: Record<HighlightType, number> = {
      dramatic_reveal: 0,
      perfect_round: 1,
      comeback: 2,
      close_finish: 3,
      new_record: 4,
      clutch_correct: 5,
      speed_demon: 6,
      streak_milestone: 7,
      unbreakable: 8,
      big_blunder: 9,
    };
    return (priority[a.type] ?? 10) - (priority[b.type] ?? 10);
  });

  const stats = computeStats(rounds);
  const { shareText, shareEmoji } = buildShareText(stats, outcome, opponentScore);

  return { moments: uniqueMoments, stats, shareText, shareEmoji };
}

export function formatShareCaption(reel: HighlightReel, playerName: string): string {
  const lines: string[] = [];
  lines.push(`🧠 ${playerName}'s Highlight Reel`);
  lines.push('');
  lines.push(`✅ ${reel.stats.accuracy}% accuracy`);
  lines.push(`⚡ Avg speed: ${(reel.stats.avgSpeed / 1000).toFixed(1)}s`);
  lines.push(`🔥 Best streak: ${reel.stats.bestStreak}`);
  lines.push(`💰 ${reel.stats.totalPoints} points`);
  lines.push('');
  if (reel.moments.length > 0) {
    lines.push('Highlights:');
    for (const m of reel.moments.slice(0, 5)) {
      lines.push(`${m.emoji} ${m.label} — ${m.description}`);
    }
  }
  lines.push('');
  lines.push(reel.shareText);
  return lines.join('\n');
}
