import type { Category } from '../types';

const HOST_INTROS = [
  'Here comes your next question.',
  'Listen carefully — this one counts.',
  'Think fast — the clock is ticking.',
  'All eyes on the board.',
  'Category specialists — this is your moment.',
];

export function hostIntroLine(questionNum: number, total: number, category: Category): string {
  const flavor = HOST_INTROS[(questionNum - 1) % HOST_INTROS.length];
  return `Question ${questionNum} of ${total}. ${category}. ${flavor}`;
}

export function countdownLabel(n: number): string {
  if (n <= 0) return 'Go!';
  if (n === 1) return 'One';
  if (n === 2) return 'Two';
  if (n === 3) return 'Three';
  return String(n);
}

export function countdownVoiceLine(n: number): string {
  if (n <= 0) return "Let's go!";
  if (n === 1) return 'One!';
  if (n === 2) return 'Two!';
  if (n === 3) return 'Three!';
  return `${n}!`;
}

export function preMatchCountdownLine(modeLabel: string): string {
  return `Get ready for ${modeLabel}. Three, two, one, go!`;
}
