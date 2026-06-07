export const ROUND_TIME_MS = 10000; // 10s per question

// Speed + accuracy scoring: a correct answer is worth a base of points plus a
// time bonus that decays linearly. Wrong/no answer scores nothing. This rewards
// both knowing the answer AND answering fast -> tense, addictive races.
export const BASE_POINTS = 100;
export const MAX_TIME_BONUS = 100;

export function scoreAnswer(correct: boolean, ms: number): number {
  if (!correct) return 0;
  const clamped = Math.max(0, Math.min(ms, ROUND_TIME_MS));
  const bonus = Math.round(MAX_TIME_BONUS * (1 - clamped / ROUND_TIME_MS));
  return BASE_POINTS + bonus;
}
