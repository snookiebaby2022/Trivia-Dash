import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const SOUNDS = {
  victory: require('../../assets/sounds/victory.mp3'),
  /** Short soft bell — used after question voiceover ends. */
  chime: require('../../assets/sounds/victory.mp3'),
} as const;

let audioReady = false;
let sfxBusy = false;

async function ensureAudioMode(): Promise<void> {
  if (audioReady) return;
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'duckOthers',
    allowsRecording: false,
    shouldPlayInBackground: false,
  });
  audioReady = true;
}

export async function initAudio(): Promise<void> {
  try {
    await ensureAudioMode();
  } catch (e) {
    console.warn('[audio] init failed', e);
  }
}

function playOneShot(source: number, volume: number, onFinish?: () => void): void {
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
  playOneShot(SOUNDS.victory, 0.5);
}

/** Pleasant "your turn" chime after the host reads the question. */
export async function playQuestionChime(): Promise<void> {
  playOneShot(SOUNDS.chime, 0.18);
}

export async function playCelebration(_hasMilestone: boolean): Promise<void> {
  await playVictoryStinger();
}
