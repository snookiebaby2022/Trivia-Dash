import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_PACK_KEY = 'bb.sound_pack.v1';

export type SoundPackId = 'classic' | 'retro' | 'modern' | 'dramatic';

export interface SoundPackDef {
  id: SoundPackId;
  label: string;
  description: string;
  emoji: string;
}

export const SOUND_PACKS: SoundPackDef[] = [
  { id: 'classic', label: 'Classic', description: 'Original game show sounds', emoji: '🎙' },
  { id: 'retro', label: 'Retro', description: '8-bit arcade vibes', emoji: '🕹' },
  { id: 'modern', label: 'Modern', description: 'Clean, minimal tones', emoji: '✨' },
  { id: 'dramatic', label: 'Dramatic', description: 'Intense orchestral hits', emoji: '🎬' },
];

const SOUND_NAMES = ['correct', 'wrong', 'tick', 'lock-in', 'countdown', 'combo', 'tension'] as const;
type SoundName = typeof SOUND_NAMES[number];

const classicAssets: Record<SoundName, number> = {
  correct: require('../../assets/sounds/correct.mp3'),
  wrong: require('../../assets/sounds/wrong.mp3'),
  tick: require('../../assets/sounds/tick.mp3'),
  'lock-in': require('../../assets/sounds/lock-in.mp3'),
  countdown: require('../../assets/sounds/countdown.mp3'),
  combo: require('../../assets/sounds/combo.mp3'),
  tension: require('../../assets/sounds/tension.mp3'),
};

const retroAssets: Record<SoundName, number> = {
  correct: require('../../assets/sounds/retro/correct.mp3'),
  wrong: require('../../assets/sounds/retro/wrong.mp3'),
  tick: require('../../assets/sounds/retro/tick.mp3'),
  'lock-in': require('../../assets/sounds/retro/lock-in.mp3'),
  countdown: require('../../assets/sounds/retro/countdown.mp3'),
  combo: require('../../assets/sounds/retro/combo.mp3'),
  tension: require('../../assets/sounds/retro/tension.mp3'),
};

const modernAssets: Record<SoundName, number> = {
  correct: require('../../assets/sounds/modern/correct.mp3'),
  wrong: require('../../assets/sounds/modern/wrong.mp3'),
  tick: require('../../assets/sounds/modern/tick.mp3'),
  'lock-in': require('../../assets/sounds/modern/lock-in.mp3'),
  countdown: require('../../assets/sounds/modern/countdown.mp3'),
  combo: require('../../assets/sounds/modern/combo.mp3'),
  tension: require('../../assets/sounds/modern/tension.mp3'),
};

const dramaticAssets: Record<SoundName, number> = {
  correct: require('../../assets/sounds/dramatic/correct.mp3'),
  wrong: require('../../assets/sounds/dramatic/wrong.mp3'),
  tick: require('../../assets/sounds/dramatic/tick.mp3'),
  'lock-in': require('../../assets/sounds/dramatic/lock-in.mp3'),
  countdown: require('../../assets/sounds/dramatic/countdown.mp3'),
  combo: require('../../assets/sounds/dramatic/combo.mp3'),
  tension: require('../../assets/sounds/dramatic/tension.mp3'),
};

const PACK_ASSETS: Record<SoundPackId, Record<SoundName, number>> = {
  classic: classicAssets,
  retro: retroAssets,
  modern: modernAssets,
  dramatic: dramaticAssets,
};

let currentPack: SoundPackId = 'classic';

export async function initSoundPacks(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SOUND_PACK_KEY);
    if (raw && (SOUND_PACKS.some((p) => p.id === raw))) {
      currentPack = raw as SoundPackId;
    }
  } catch {
    // fresh
  }
}

export function getCurrentSoundPack(): SoundPackId {
  return currentPack;
}

export function getSoundPackDef(id: SoundPackId): SoundPackDef {
  return SOUND_PACKS.find((p) => p.id === id) ?? SOUND_PACKS[0];
}

export async function setSoundPack(id: SoundPackId): Promise<void> {
  currentPack = id;
  try {
    await AsyncStorage.setItem(SOUND_PACK_KEY, id);
  } catch {
    // best effort
  }
}

export function getSoundAsset(soundName: string): number {
  const name = soundName as SoundName;
  const assets = PACK_ASSETS[currentPack];
  if (assets && name in assets) return assets[name];
  return classicAssets[name] ?? classicAssets.correct;
}
