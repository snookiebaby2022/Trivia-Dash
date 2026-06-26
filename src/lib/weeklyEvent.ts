import { CATEGORY_LIST } from './categoryTheme';
import type { Category } from '../types';

export interface WeeklyEvent {
  weekKey: string;
  category: Category;
  label: string;
  emoji: string;
  bonusXpPercent: number;
}

const WEEKLY_THEMES: { category: Category; label: string; emoji: string }[] = [
  { category: 'Science', label: 'Science Week', emoji: '🔬' },
  { category: 'History', label: 'History Week', emoji: '📜' },
  { category: 'Geography', label: 'Geography Week', emoji: '🌍' },
  { category: 'Sports', label: 'Sports Week', emoji: '⚽' },
  { category: 'Entertainment', label: 'Entertainment Week', emoji: '🎬' },
  { category: 'Pop Culture', label: 'Pop Culture Week', emoji: '📱' },
  { category: 'Art', label: 'Art Week', emoji: '🎨' },
  { category: 'Music', label: 'Music Week', emoji: '🎵' },
  { category: 'Technology', label: 'Tech Week', emoji: '💻' },
  { category: 'Nature', label: 'Nature Week', emoji: '🌿' },
  { category: 'Literature', label: 'Literature Week', emoji: '📚' },
  { category: 'General', label: 'Wildcard Week', emoji: '💡' },
];

export function weekKey(d = new Date()): string {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

export function getWeeklyEvent(d = new Date()): WeeklyEvent {
  const wk = weekKey(d);
  const idx = Math.abs(hash(wk)) % WEEKLY_THEMES.length;
  const theme = WEEKLY_THEMES[idx] ?? { category: CATEGORY_LIST[0], label: 'Trivia Week', emoji: '🧠' };
  return {
    weekKey: wk,
    category: theme.category,
    label: theme.label,
    emoji: theme.emoji,
    bonusXpPercent: 25,
  };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export function weeklyXpBonus(baseXp: number, category: Category, isPro: boolean): number {
  const event = getWeeklyEvent();
  if (category !== event.category) return baseXp;
  if (!isPro) return baseXp;
  return Math.round(baseXp * (1 + event.bonusXpPercent / 100));
}
