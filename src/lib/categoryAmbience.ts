import type { AudioPlayer } from 'expo-audio';
import { createAudioPlayer } from 'expo-audio';

import type { Category } from '../types';
import { isSfxEnabled } from './gameAudio';
import { initAudio } from './audio';

const AMBIENCE_CATEGORIES = new Set<Category>(['Entertainment', 'Music', 'Movies', 'Pop Culture']);

const SOUNDS: Partial<Record<Category, number>> = {
  Entertainment: require('../../assets/sounds/menu-loop.mp3'),
  Music: require('../../assets/sounds/menu-loop.mp3'),
  Movies: require('../../assets/sounds/menu-loop.mp3'),
  'Pop Culture': require('../../assets/sounds/menu-loop.mp3'),
};

let player: AudioPlayer | null = null;
let activeCategory: Category | null = null;

export function shouldPlayCategoryAmbience(category: Category): boolean {
  return isSfxEnabled() && AMBIENCE_CATEGORIES.has(category);
}

export async function startCategoryAmbience(category: Category): Promise<void> {
  if (!shouldPlayCategoryAmbience(category)) {
    stopCategoryAmbience();
    return;
  }
  if (activeCategory === category && player) return;

  stopCategoryAmbience();
  const source = SOUNDS[category];
  if (!source) return;

  try {
    await initAudio();
    const next = createAudioPlayer(source);
    next.volume = 0.12;
    next.loop = true;
    next.play();
    player = next;
    activeCategory = category;
  } catch (e) {
    console.warn('[ambience] failed', e);
  }
}

export function stopCategoryAmbience(): void {
  if (!player) return;
  try {
    player.pause();
    player.remove();
  } catch {
    // best effort
  }
  player = null;
  activeCategory = null;
}
