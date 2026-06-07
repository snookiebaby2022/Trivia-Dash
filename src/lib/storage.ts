import AsyncStorage from '@react-native-async-storage/async-storage';

import { normalizeAvatar, randomAvatar } from './avatars';
import {
  clampVoicePreset,
  isBadgeLocked,
  isFrameLocked,
  loadProStatus,
} from './monetization';
import { defaultAchievementState, defaultProfileStats } from './achievements';
import type { Profile } from '../types';

const PROFILE_KEY = 'bb.profile.v3';

function randomId(): string {
  return 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function randomGuestName(): string {
  const adjectives = ['Party', 'Trivia', 'Quiz', 'Brain', 'Clever', 'Witty', 'Bold', 'Fierce'];
  const nouns = ['Fox', 'Owl', 'Wolf', 'Hawk', 'Star', 'Ace', 'King', 'Legend'];
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  return `${a}${n}${Math.floor(Math.random() * 90 + 10)}`;
}

export function newProfile(): Profile {
  return {
    id: randomId(),
    username: randomGuestName(),
    avatar: randomAvatar(),
    voicePreset: 'host',
    voiceEnabled: true,
    elo: 1000,
    wins: 0,
    losses: 0,
    draws: 0,
    bestStreak: 0,
    streak: 0,
    isPro: false,
    dailyStreak: 0,
    streakShield: false,
    achievementState: defaultAchievementState(),
    stats: defaultProfileStats(),
  };
}

function clampAvatarForProfile(avatar: Profile['avatar'], profile: Profile): Profile['avatar'] {
  const a = normalizeAvatar(avatar);
  const unlocks = profile.achievementState?.cosmeticUnlocks;
  return normalizeAvatar({
    ...a,
    frame: isFrameLocked(a.frame, profile.isPro, unlocks) ? 'classic' : a.frame,
    badge: isBadgeLocked(a.badge, profile.isPro, unlocks) ? 'none' : a.badge,
  });
}

function migrateProfile(raw: Partial<Profile>): Profile {
  const base = newProfile();
  const isPro = raw.isPro ?? false;
  return {
    ...base,
    ...raw,
    avatar: clampAvatarForProfile(raw.avatar ?? base.avatar, {
      ...base,
      ...raw,
      isPro,
      achievementState: raw.achievementState ?? defaultAchievementState(),
    } as Profile),
    voicePreset: clampVoicePreset(raw.voicePreset ?? 'host', isPro),
    voiceEnabled: raw.voiceEnabled ?? true,
    isPro,
    dailyStreak: raw.dailyStreak ?? 0,
    streakShield: raw.streakShield ?? false,
    dailyExtraPlayDate: raw.dailyExtraPlayDate,
    achievementState: raw.achievementState ?? defaultAchievementState(),
    stats: { ...defaultProfileStats(), ...raw.stats },
  };
}

export async function loadProfile(): Promise<Profile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) {
      const legacy = await AsyncStorage.getItem('bb.profile.v2');
      if (legacy) {
        const parsed = migrateProfile(JSON.parse(legacy) as Partial<Profile>);
        const isPro = parsed.isPro || (await loadProStatus());
        const profile = { ...parsed, isPro };
        await saveProfile(profile);
        return profile;
      }
    } else {
      const parsed = migrateProfile(JSON.parse(raw) as Partial<Profile>);
      const isPro = parsed.isPro || (await loadProStatus());
      return { ...parsed, isPro };
    }
  } catch {
    // fall through
  }
  const profile = { ...newProfile(), isPro: await loadProStatus() };
  await saveProfile(profile);
  return profile;
}

export async function saveProfile(profile: Profile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // best effort
  }
}
