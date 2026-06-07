import type { AvatarConfig, AvatarBadge, AvatarFrame } from '../types';

export const AVATAR_EMOJIS = [
  '🦊', '🦉', '🐺', '🦁', '🐸', '🦄', '🐙', '🦖', '🐼', '🦩',
  '🐯', '🐧', '🎭', '🎪', '🎸', '🍕', '🐉', '🦈', '🐝', '🦋',
  '🐨', '🦥', '🐵', '🐱', '🐶', '🐮', '🐷', '🐔', '🦅', '🐢',
  '👾', '🤖', '👻', '💀', '🎃', '⭐', '🔥', '💎', '🎯', '🏆',
];

export const AVATAR_COLORS = [
  '#FF6B4A', '#7C5CFF', '#4A90D9', '#FFC44D', '#3DDC97', '#FF5C8A',
  '#9B59B6', '#2ECC71', '#E0925C', '#FF5470', '#F39C12', '#3498DB',
  '#E74C3C', '#1ABC9C', '#8E44AD', '#D35400', '#00BCD4', '#795548',
];

export const AVATAR_FRAMES: { id: AvatarFrame; label: string; border: string; width: number }[] = [
  { id: 'none', label: 'None', border: 'transparent', width: 0 },
  { id: 'classic', label: 'Classic', border: '#FFD24D', width: 3 },
  { id: 'gold', label: 'Gold', border: '#FFC44D', width: 4 },
  { id: 'silver', label: 'Silver', border: '#CBD3DE', width: 3 },
  { id: 'neon', label: 'Neon', border: '#FF5C8A', width: 3 },
  { id: 'star', label: 'Star', border: '#7CE7FF', width: 4 },
];

export const AVATAR_BADGES: { id: AvatarBadge; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'crown', label: '👑 Crown' },
  { id: 'star', label: '⭐ Star' },
  { id: 'fire', label: '🔥 Fire' },
  { id: 'bolt', label: '⚡ Bolt' },
  { id: 'gem', label: '💎 Gem' },
  { id: 'trophy', label: '🏆 Trophy' },
  { id: 'party', label: '🎉 Party' },
];

const BADGE_EMOJI: Record<Exclude<AvatarBadge, 'none'>, string> = {
  crown: '👑',
  star: '⭐',
  fire: '🔥',
  bolt: '⚡',
  gem: '💎',
  trophy: '🏆',
  party: '🎉',
};

export const DEFAULT_AVATAR: AvatarConfig = {
  emoji: '🦊',
  color: '#FF6B4A',
  frame: 'classic',
  badge: 'none',
};

/** @deprecated use AVATAR_EMOJIS — kept for leaderboard bots */
export const AVATAR_PRESETS: AvatarConfig[] = AVATAR_EMOJIS.slice(0, 16).map((emoji, i) => ({
  emoji,
  color: AVATAR_COLORS[i % AVATAR_COLORS.length],
  frame: 'classic' as const,
  badge: 'none' as const,
}));

export function normalizeAvatar(raw?: Partial<AvatarConfig>): AvatarConfig {
  return {
    emoji: raw?.emoji && AVATAR_EMOJIS.includes(raw.emoji) ? raw.emoji : DEFAULT_AVATAR.emoji,
    color: raw?.color ?? DEFAULT_AVATAR.color,
    frame: raw?.frame ?? 'classic',
    badge: raw?.badge ?? 'none',
  };
}

export function randomAvatar(): AvatarConfig {
  return {
    emoji: AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)],
    color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    frame: 'classic',
    badge: 'none',
  };
}

export function badgeEmoji(badge: AvatarBadge): string | null {
  if (badge === 'none') return null;
  return BADGE_EMOJI[badge];
}

export function avatarKey(a: AvatarConfig): string {
  return `${a.emoji}:${a.color}:${a.frame}:${a.badge}`;
}

export function parseAvatarKey(key: string): AvatarConfig {
  const [emoji, color, frame, badge] = key.split(':');
  return normalizeAvatar({
    emoji,
    color,
    frame: frame as AvatarFrame,
    badge: badge as AvatarBadge,
  });
}

export function frameStyle(frame: AvatarFrame) {
  return AVATAR_FRAMES.find((f) => f.id === frame) ?? AVATAR_FRAMES[1];
}
