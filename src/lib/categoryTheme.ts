import type { Category } from '../types';

export interface CategoryTheme {
  fill: string;
  accent: string;
  dark: string;
  glow: string;
  /** Display name — sentence case, modern labels */
  label: string;
  icon: string;
}

/** Category wedge palette — vivid neons tuned for dark UI (2020s quiz-app style). */
export const CATEGORY_WEDGES: Record<Category, CategoryTheme> = {
  Geography: {
    fill: '#06B6D4',
    accent: '#22D3EE',
    dark: '#0E7490',
    glow: 'rgba(6, 182, 212, 0.45)',
    label: 'Geography',
    icon: '🌍',
  },
  Entertainment: {
    fill: '#D946EF',
    accent: '#E879F9',
    dark: '#86198F',
    glow: 'rgba(217, 70, 239, 0.45)',
    label: 'Entertainment',
    icon: '🎬',
  },
  History: {
    fill: '#F59E0B',
    accent: '#FBBF24',
    dark: '#B45309',
    glow: 'rgba(245, 158, 11, 0.45)',
    label: 'History',
    icon: '📜',
  },
  Science: {
    fill: '#10B981',
    accent: '#34D399',
    dark: '#047857',
    glow: 'rgba(16, 185, 129, 0.45)',
    label: 'Science',
    icon: '🔬',
  },
  Sports: {
    fill: '#F97316',
    accent: '#FB923C',
    dark: '#C2410C',
    glow: 'rgba(249, 115, 22, 0.45)',
    label: 'Sports',
    icon: '⚽',
  },
  General: {
    fill: '#8B5CF6',
    accent: '#A78BFA',
    dark: '#5B21B6',
    glow: 'rgba(139, 92, 246, 0.45)',
    label: 'General',
    icon: '💡',
  },
  'Pop Culture': {
    fill: '#F472B6',
    accent: '#F9A8D4',
    dark: '#BE185D',
    glow: 'rgba(244, 114, 182, 0.45)',
    label: 'Pop Culture',
    icon: '📱',
  },
};

export const CATEGORY_LIST = Object.keys(CATEGORY_WEDGES) as Category[];

export function getCategoryTheme(category: Category): CategoryTheme {
  return CATEGORY_WEDGES[category] ?? CATEGORY_WEDGES.General;
}
