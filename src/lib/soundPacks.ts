import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

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

/**
 * Get the require() source for a sound in the current pack.
 * Falls back to classic pack if the file doesn't exist.
 */
export function getSoundAsset(soundName: string): number {
  const pack = currentPack;
  try {
    if (pack === 'retro') {
      return require(`../../assets/sounds/retro/${soundName}.mp3`);
    }
    if (pack === 'modern') {
      return require(`../../assets/sounds/modern/${soundName}.mp3`);
    }
    if (pack === 'dramatic') {
      return require(`../../assets/sounds/dramatic/${soundName}.mp3`);
    }
  } catch {
    // fallback to classic
  }
  return require(`../../assets/sounds/${soundName}.mp3`);
}
