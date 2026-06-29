import AsyncStorage from '@react-native-async-storage/async-storage';
import { track } from './analytics';
import type { AvatarFrame, AvatarBadge, Profile } from '../types';
import { spendCoins } from './coins';

export type ShopCategory = 'frames' | 'badges' | 'power_ups' | 'boosts';

export interface ShopItem {
  id: string;
  category: ShopCategory;
  name: string;
  description: string;
  emoji: string;
  price: number;
  /** If set, grants this cosmetic directly */
  grantFrame?: AvatarFrame;
  grantBadge?: AvatarBadge;
  /** If set, grants power-ups */
  grantPowerUps?: { fiftyFifty?: number; extraTime?: number; skip?: number };
  /** If set, grants a boost effect */
  grantBoost?: { type: string; value: number };
}

export const SHOP_ITEMS: ShopItem[] = [
  // Frames
  { id: 'frame_gold', category: 'frames', name: 'Gold Frame', description: 'Shimmering gold avatar border', emoji: '🥇', price: 500, grantFrame: 'gold' },
  { id: 'frame_silver', category: 'frames', name: 'Silver Frame', description: 'Sleek silver avatar border', emoji: '🥈', price: 300, grantFrame: 'silver' },
  { id: 'frame_neon', category: 'frames', name: 'Neon Frame', description: 'Electric neon glow border', emoji: '💫', price: 400, grantFrame: 'neon' },
  { id: 'frame_star', category: 'frames', name: 'Star Frame', description: 'Animated starburst border', emoji: '⭐', price: 750, grantFrame: 'star' },

  // Badges
  { id: 'badge_crown', category: 'badges', name: 'Crown Badge', description: 'Royal crown for your avatar', emoji: '👑', price: 400, grantBadge: 'crown' },
  { id: 'badge_bolt', category: 'badges', name: 'Bolt Badge', description: 'Lightning bolt of power', emoji: '⚡', price: 250, grantBadge: 'bolt' },
  { id: 'badge_gem', category: 'badges', name: 'Gem Badge', description: 'Precious gem badge', emoji: '💎', price: 350, grantBadge: 'gem' },
  { id: 'badge_trophy', category: 'badges', name: 'Trophy Badge', description: 'Champion trophy badge', emoji: '🏆', price: 500, grantBadge: 'trophy' },
  { id: 'badge_party', category: 'badges', name: 'Party Badge', description: 'Party celebration badge', emoji: '🎉', price: 200, grantBadge: 'party' },

  // Power-ups
  { id: 'pu_5050_pack', category: 'power_ups', name: '50/50 Pack', description: '3x 50/50 lifelines', emoji: '✂️', price: 100, grantPowerUps: { fiftyFifty: 3 } },
  { id: 'pu_time_pack', category: 'power_ups', name: 'Time Pack', description: '3x +5s extra time', emoji: '⏰', price: 90, grantPowerUps: { extraTime: 3 } },
  { id: 'pu_skip_pack', category: 'power_ups', name: 'Skip Pack', description: '3x skip questions', emoji: '⏭️', price: 150, grantPowerUps: { skip: 3 } },
  { id: 'pu_mega_pack', category: 'power_ups', name: 'Mega Pack', description: '2x of each power-up', emoji: '🎁', price: 300, grantPowerUps: { fiftyFifty: 2, extraTime: 2, skip: 2 } },

  // Boosts
  { id: 'boost_xp_2x', category: 'boosts', name: '2x XP Boost', description: 'Double XP for 3 matches', emoji: '🚀', price: 200, grantBoost: { type: 'xp_multiplier', value: 2 } },
  { id: 'boost_coins_2x', category: 'boosts', name: '2x Coins Boost', description: 'Double coins for 3 matches', emoji: '💰', price: 150, grantBoost: { type: 'coin_multiplier', value: 2 } },
];

const OWNED_KEY = 'bb.shop_owned.v1';
const BOOSTS_KEY = 'bb.active_boosts.v1';

let owned: string[] = [];
let activeBoosts: { type: string; value: number; matchesLeft: number }[] = [];

export async function initShop(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(OWNED_KEY);
    if (raw) owned = JSON.parse(raw);
  } catch {
    owned = [];
  }
  try {
    const raw = await AsyncStorage.getItem(BOOSTS_KEY);
    if (raw) activeBoosts = JSON.parse(raw);
  } catch {
    activeBoosts = [];
  }
}

export function isOwned(itemId: string): boolean {
  return owned.includes(itemId);
}

export function getOwnedItems(): string[] {
  return [...owned];
}

export function getActiveBoosts(): { type: string; value: number; matchesLeft: number }[] {
  return [...activeBoosts];
}

export function getBoostMultiplier(type: string): number {
  const boost = activeBoosts.find((b) => b.type === type && b.matchesLeft > 0);
  return boost?.value ?? 1;
}

export function consumeBoostMatch(): void {
  activeBoosts = activeBoosts
    .map((b) => ({ ...b, matchesLeft: b.matchesLeft - 1 }))
    .filter((b) => b.matchesLeft > 0);
  void AsyncStorage.setItem(BOOSTS_KEY, JSON.stringify(activeBoosts)).catch(() => {});
}

export function canBuy(item: ShopItem, profile: Profile): boolean {
  if (isOwned(item.id)) return false;
  if (item.grantBoost && activeBoosts.some((b) => b.type === item.grantBoost!.type)) return false;
  return (profile.coins ?? 0) >= item.price;
}

export function buyItem(
  item: ShopItem,
  profile: Profile
): { profile: Profile; success: boolean; error?: string } {
  if (isOwned(item.id)) {
    return { profile, success: false, error: 'Already owned' };
  }

  const spent = spendCoins(profile, item.price);
  if (!spent) {
    return { profile, success: false, error: 'Not enough coins' };
  }

  let next = spent;

  if (item.grantFrame) {
    next = {
      ...next,
      achievementState: {
        ...next.achievementState,
        cosmeticUnlocks: {
          ...next.achievementState.cosmeticUnlocks,
          frames: [...new Set([...next.achievementState.cosmeticUnlocks.frames, item.grantFrame])],
        },
      },
    };
  }

  if (item.grantBadge) {
    next = {
      ...next,
      achievementState: {
        ...next.achievementState,
        cosmeticUnlocks: {
          ...next.achievementState.cosmeticUnlocks,
          badges: [...new Set([...next.achievementState.cosmeticUnlocks.badges, item.grantBadge])],
        },
      },
    };
  }

  if (item.grantPowerUps) {
    const inv = next.powerUps ?? { fiftyFifty: 0, extraTime: 0, skip: 0 };
    next = {
      ...next,
      powerUps: {
        fiftyFifty: inv.fiftyFifty + (item.grantPowerUps.fiftyFifty ?? 0),
        extraTime: inv.extraTime + (item.grantPowerUps.extraTime ?? 0),
        skip: inv.skip + (item.grantPowerUps.skip ?? 0),
      },
    };
  }

  if (item.grantBoost) {
    activeBoosts.push({
      type: item.grantBoost.type,
      value: item.grantBoost.value,
      matchesLeft: 3,
    });
    void AsyncStorage.setItem(BOOSTS_KEY, JSON.stringify(activeBoosts)).catch(() => {});
  }

  owned.push(item.id);
  void AsyncStorage.setItem(OWNED_KEY, JSON.stringify(owned)).catch(() => {});

  track({ type: 'shop_purchase', itemId: item.id, cost: item.price, timestamp: Date.now() });

  return { profile: next, success: true };
}

export function getShopItemsByCategory(category: ShopCategory): ShopItem[] {
  return SHOP_ITEMS.filter((i) => i.category === category);
}
