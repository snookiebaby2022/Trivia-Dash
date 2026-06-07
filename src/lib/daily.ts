import type { DailyChallengeInfo } from '../types';
import {
  DAILY_QUESTIONS_COUNT,
  dateSeed,
  getQuestionPool,
  pickMatchQuestions,
} from '../data/questions';
import { APP_NAME } from './brand';

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function getDailyChallenge(isPro: boolean, dateKey = todayKey()): DailyChallengeInfo {
  const seed = dateSeed(dateKey);
  const questions = pickMatchQuestions(DAILY_QUESTIONS_COUNT, seed, { isPro });
  return {
    dateKey,
    questionIds: questions.map((q) => q.id),
  };
}

export function getDailyQuestions(isPro: boolean, dateKey = todayKey()) {
  const challenge = getDailyChallenge(isPro, dateKey);
  const pool = getQuestionPool(isPro);
  return challenge.questionIds
    .map((id) => pool.find((q) => q.id === id))
    .filter(Boolean) as ReturnType<typeof pickMatchQuestions>;
}

export function dailyShareSeed(dateKey: string): number {
  return dateSeed(`daily-share-${dateKey}`);
}

export function emojiForRound(correct: boolean, points: number, maxPoints = 200): string {
  if (!correct) return '⬛';
  const ratio = points / maxPoints;
  if (ratio >= 0.85) return '🟩';
  if (ratio >= 0.55) return '🟨';
  return '🟧';
}

export function buildShareGrid(
  rounds: { correct: boolean; points: number }[],
  dateKey: string,
  score: number,
  streak: number
): string {
  const grid = rounds.map((r) => emojiForRound(r.correct, r.points)).join('');
  return (
    `${APP_NAME} Daily ${dateKey} · 10 Qs\n` +
    `${grid}\n` +
    `Score: ${score} · Streak: ${streak} 🔥\n` +
    `Can you beat me? 🧠⚔`
  );
}

export function nextDailyStreak(lastDate: string | undefined, dateKey: string, streak: number): number {
  if (!lastDate) return 1;
  const last = new Date(lastDate);
  const today = new Date(dateKey);
  const diffDays = Math.round((today.getTime() - last.getTime()) / 86400000);
  if (diffDays === 0) return streak;
  if (diffDays === 1) return streak + 1;
  return 1;
}

/** Applies streak shield when the player missed a day. */
export function nextDailyStreakWithShield(
  lastDate: string | undefined,
  dateKey: string,
  streak: number,
  hasShield: boolean
): { streak: number; consumedShield: boolean } {
  if (!lastDate) return { streak: 1, consumedShield: false };
  const last = new Date(lastDate);
  const today = new Date(dateKey);
  const diffDays = Math.round((today.getTime() - last.getTime()) / 86400000);
  if (diffDays === 0) return { streak, consumedShield: false };
  if (diffDays === 1) return { streak: streak + 1, consumedShield: false };
  if (hasShield && diffDays > 1) return { streak: streak + 1, consumedShield: true };
  return { streak: 1, consumedShield: false };
}
