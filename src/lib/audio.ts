import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { isSfxEnabled } from './gameAudio';

const SOUNDS = {
  victory: require('../../assets/sounds/victory.mp3'),
  milestone: require('../../assets/sounds/milestone.mp3'),
} as const;

let audioReady = false;
let sfxBusy = false;

async function ensureAudioMode(): Promise<void> {
  if (audioReady) return;
  await setAudioModeAsync({
    playsInSilentMode: isSfxEnabled(),
    interruptionMode: 'duckOthers',
    allowsRecording: false,
    shouldPlayInBackground: false,
  });
  audioReady = true;
}

/** Re-apply audio mode when user toggles sound in settings. */
export async function refreshAudioMode(): Promise<void> {
  audioReady = false;
  await ensureAudioMode();
}

export async function initAudio(): Promise<void> {
  try {
    await ensureAudioMode();
  } catch (e) {
    console.warn('[audio] init failed', e);
  }
}

function playOneShot(source: number, volume: number, onFinish?: () => void): void {
  if (!isSfxEnabled()) return;
  if (sfxBusy) return;
  sfxBusy = true;

  void ensureAudioMode()
    .then(() => {
      const player = createAudioPlayer(source);
      player.volume = volume;

      const subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (!status.didJustFinish) return;
        subscription.remove();
        player.remove();
        sfxBusy = false;
        onFinish?.();
      });

      player.play();
    })
    .catch((e) => {
      sfxBusy = false;
      console.warn('[audio] sfx failed', e);
    });
}

export async function playVictoryStinger(): Promise<void> {
  playOneShot(SOUNDS.victory, 0.45);
}

export async function playMilestoneStinger(): Promise<void> {
  playOneShot(SOUNDS.milestone, 0.35);
}

/** @deprecated Post-question chime removed — was playing victory.mp3 and annoyed players. */
export async function playQuestionChime(): Promise<void> {}

export async function playCelebration(_hasMilestone: boolean): Promise<void> {
  if (_hasMilestone) {
    await playMilestoneStinger();
  } else {
    await playVictoryStinger();
  }
}
