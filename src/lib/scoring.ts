export const ROUND_TIME_MS = 10000; // 10s per question

// Speed + accuracy scoring: a correct answer is worth a base of points plus a
// time bonus that decays linearly. Wrong/no answer scores nothing. This rewards
// both knowing the answer AND answering fast -> tense, addictive races.
export const BASE_POINTS = 100;
export const MAX_TIME_BONUS = 100;

export function scoreAnswer(correct: boolean, ms: number, comboStreak = 0): number {
  if (!correct) return 0;
  const clamped = Math.max(0, Math.min(ms, ROUND_TIME_MS));
  const bonus = Math.round(MAX_TIME_BONUS * (1 - clamped / ROUND_TIME_MS));
  const base = BASE_POINTS + bonus;
  const mult =
    comboStreak < 2 ? 1 : comboStreak < 4 ? 2 : comboStreak < 6 ? 3 : comboStreak < 8 ? 4 : 5;
  return Math.round(base * mult);
}
