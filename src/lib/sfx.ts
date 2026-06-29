import { createAudioPlayer } from 'expo-audio';

import { isSfxEnabled } from './gameAudio';
import { getSoundAsset } from './soundPacks';

let sfxBusy = false;

function playOneShot(soundName: string, volume: number = 0.6): void {
  if (!isSfxEnabled() || sfxBusy) return;
  sfxBusy = true;
  try {
    const source = getSoundAsset(soundName);
    const player = createAudioPlayer(source);
    player.volume = volume;
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        sub.remove();
        player.remove();
        sfxBusy = false;
      }
    });
    player.play();
  } catch {
    sfxBusy = false;
  }
}

let tensionPlayer: ReturnType<typeof createAudioPlayer> | null = null;

export function playCorrectSound(): void {
  playOneShot('correct', 0.7);
}

export function playWrongSound(): void {
  playOneShot('wrong', 0.7);
}

export function playTickSound(): void {
  playOneShot('tick', 0.4);
}

export function playLockInSound(): void {
  playOneShot('lock-in', 0.5);
}

export function playCountdownSound(): void {
  playOneShot('countdown', 0.5);
}

export function playComboSound(): void {
  playOneShot('combo', 0.6);
}

export function startTensionMusic(): void {
  if (!isSfxEnabled() || tensionPlayer) return;
  try {
    const source = getSoundAsset('tension');
    tensionPlayer = createAudioPlayer(source);
    tensionPlayer.volume = 0.25;
    tensionPlayer.loop = true;
    tensionPlayer.play();
  } catch {
    tensionPlayer = null;
  }
}

export function stopTensionMusic(): void {
  if (tensionPlayer) {
    try {
      tensionPlayer.pause();
      tensionPlayer.remove();
    } catch {
      // ignore
    }
    tensionPlayer = null;
  }
}
