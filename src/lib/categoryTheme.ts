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
  Art: {
    fill: '#EC4899',
    accent: '#F472B6',
    dark: '#9D174D',
    glow: 'rgba(236, 72, 153, 0.45)',
    label: 'Art',
    icon: '🎨',
  },
  Literature: {
    fill: '#6366F1',
    accent: '#818CF8',
    dark: '#4338CA',
    glow: 'rgba(99, 102, 241, 0.45)',
    label: 'Literature',
    icon: '📚',
  },
  Technology: {
    fill: '#0EA5E9',
    accent: '#38BDF8',
    dark: '#0369A1',
    glow: 'rgba(14, 165, 233, 0.45)',
    label: 'Technology',
    icon: '💻',
  },
  Nature: {
    fill: '#22C55E',
    accent: '#4ADE80',
    dark: '#15803D',
    glow: 'rgba(34, 197, 94, 0.45)',
    label: 'Nature',
    icon: '🌿',
  },
  Music: {
    fill: '#A855F7',
    accent: '#C084FC',
    dark: '#7E22CE',
    glow: 'rgba(168, 85, 247, 0.45)',
    label: 'Music',
    icon: '🎵',
  },
  Movies: {
    fill: '#EF4444',
    accent: '#F87171',
    dark: '#B91C1C',
    glow: 'rgba(239, 68, 68, 0.45)',
    label: 'Movies',
    icon: '🎥',
  },
  Food: {
    fill: '#EAB308',
    accent: '#FACC15',
    dark: '#A16207',
    glow: 'rgba(234, 179, 8, 0.45)',
    label: 'Food',
    icon: '🍕',
  },
  Animals: {
    fill: '#84CC16',
    accent: '#A3E635',
    dark: '#4D7C0F',
    glow: 'rgba(132, 204, 22, 0.45)',
    label: 'Animals',
    icon: '🐾',
  },
  Politics: {
    fill: '#64748B',
    accent: '#94A3B8',
    dark: '#334155',
    glow: 'rgba(100, 116, 139, 0.45)',
    label: 'Politics',
    icon: '🏛️',
  },
  Space: {
    fill: '#1E3A8A',
    accent: '#3B82F6',
    dark: '#1E40AF',
    glow: 'rgba(30, 58, 138, 0.55)',
    label: 'Space',
    icon: '🚀',
  },
  Mythology: {
    fill: '#7C3AED',
    accent: '#A78BFA',
    dark: '#5B21B6',
    glow: 'rgba(124, 58, 237, 0.45)',
    label: 'Mythology',
    icon: '⚡',
  },
};

export const CATEGORY_LIST = Object.keys(CATEGORY_WEDGES) as Category[];

export function getCategoryTheme(category: Category): CategoryTheme {
  return CATEGORY_WEDGES[category] ?? CATEGORY_WEDGES.General;
}
