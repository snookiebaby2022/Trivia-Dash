import type { BotDifficulty, Question } from '../types';
import { seedRandom } from '../data/questions';
import { ROUND_TIME_MS, scoreAnswer } from './scoring';

export type { BotDifficulty };

export interface GhostMove {
  correct: boolean;
  ms: number;
  points: number;
}

export interface Ghost {
  name: string;
  elo: number;
  accuracy: number;
  speedMs: [number, number];
  difficulty?: BotDifficulty;
  blankChance?: number;
}

const GHOST_NAMES = [
  'NeoMind',
  'QuizWolf',
  'TriviaTitan',
  'BrainByte',
  'FactHunter',
  'SynapseX',
  'MindMaze',
  'EchoBrain',
];

const BOT_NAMES = ['Chip', 'Nova', 'Blitz', 'Pixel', 'Dash', 'Spark', 'Byte', 'Glitch'];

const DIFFICULTY_STATS: Record<
  BotDifficulty,
  { accuracy: [number, number]; speedMs: [number, number]; blankChance: number }
> = {
  easy: { accuracy: [0.28, 0.42], speedMs: [5500, 9500], blankChance: 0.35 },
  medium: { accuracy: [0.52, 0.66], speedMs: [3200, 6800], blankChance: 0.2 },
  hard: { accuracy: [0.72, 0.84], speedMs: [1800, 4500], blankChance: 0.1 },
  very_hard: { accuracy: [0.86, 0.94], speedMs: [1000, 2800], blankChance: 0.05 },
  unbeatable: { accuracy: [0.96, 0.995], speedMs: [700, 1800], blankChance: 0.01 },
};

function pickInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function makeGhost(playerElo: number): Ghost {
  const elo = Math.max(800, Math.round(playerElo + (Math.random() * 240 - 120)));
  const accuracy = Math.max(0.45, Math.min(0.92, 0.5 + (elo - 1000) / 2200));
  const fast = Math.max(900, 3200 - (elo - 1000) * 0.8);
  const slow = Math.max(fast + 800, 6500 - (elo - 1000) * 0.6);
  return {
    name: GHOST_NAMES[Math.floor(Math.random() * GHOST_NAMES.length)],
    elo,
    accuracy,
    speedMs: [fast, slow],
    difficulty: 'medium',
  };
}

export function makeBot(difficulty: BotDifficulty, slot = 0): Ghost {
  const stats = DIFFICULTY_STATS[difficulty];
  const accuracy = pickInRange(stats.accuracy[0], stats.accuracy[1]);
  const fast = Math.round(pickInRange(stats.speedMs[0], stats.speedMs[1] * 0.7));
  const slow = Math.round(pickInRange(fast + 400, stats.speedMs[1]));
  const labels: Record<BotDifficulty, string> = {
    easy: 'Rookie',
    medium: 'Regular',
    hard: 'Ace',
    very_hard: 'Elite',
    unbeatable: 'Legend',
  };
  return {
    name: `${labels[difficulty]} ${BOT_NAMES[slot % BOT_NAMES.length]}`,
    elo: Math.round(800 + accuracy * 1400),
    accuracy,
    speedMs: [fast, slow],
    difficulty,
    blankChance: stats.blankChance,
  };
}

export function ghostAnswer(ghost: Ghost, question: Question): GhostMove {
  return ghostAnswerSeeded(ghost, question, 0, ghost.name, Math.floor(Math.random() * 1e9));
}

export function ghostAnswerSeeded(
  ghost: Ghost,
  _question: Question,
  roundIndex: number,
  competitorId: string,
  matchSeed: number
): GhostMove {
  const rand = seedRandom(matchSeed + roundIndex * 7919 + hashId(competitorId));
  const correct = rand() < ghost.accuracy;
  const [min, max] = ghost.speedMs;
  let ms = Math.round(min + rand() * (max - min));
  const blank = ghost.blankChance ?? 0.25;
  if (!correct && rand() < blank) ms = ROUND_TIME_MS;
  return { correct, ms, points: scoreAnswer(correct, ms) };
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
