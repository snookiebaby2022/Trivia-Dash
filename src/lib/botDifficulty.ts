import type { BotDifficulty } from '../types';

export const BOT_DIFFICULTY_LABELS: Record<BotDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  very_hard: 'Very Hard',
  unbeatable: 'Unbeatable',
};

export const BOT_DIFFICULTY_ORDER: BotDifficulty[] = [
  'easy',
  'medium',
  'hard',
  'very_hard',
  'unbeatable',
];

export const BOT_DIFFICULTY_HINTS: Record<BotDifficulty, string> = {
  easy: 'Slow & often wrong — great for warming up',
  medium: 'Balanced couch opponent',
  hard: 'Fast and sharp — bring your A-game',
  very_hard: 'Rarely misses — brutal',
  unbeatable: 'Near-perfect every round — good luck',
};
