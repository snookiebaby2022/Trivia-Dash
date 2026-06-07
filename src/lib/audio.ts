import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio';

const MUSIC_KEY = 'td.music.enabled';

const SOUNDS = {
  menu: require('../../assets/sounds/menu-loop.mp3'),
  victory: require('../../assets/sounds/victory.mp3'),
  milestone: require('../../assets/sounds/milestone.mp3'),
} as const;

let audioReady = false;
let menuPlayer: AudioPlayer | null = null;
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

export async function isMusicEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(MUSIC_KEY);
    return raw !== 'false';
  } catch {
    return true;
  }
}

export async function setMusicEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(MUSIC_KEY, enabled ? 'true' : 'false');
  if (!enabled) await stopMenuMusic();
}

export async function initAudio(): Promise<void> {
  try {
    await ensureAudioMode();
  } catch (e) {
    console.warn('[audio] init failed', e);
  }
}

export async function startMenuMusic(): Promise<void> {
  if (!(await isMusicEnabled())) return;

  try {
    await ensureAudioMode();

    if (menuPlayer) {
      if (!menuPlayer.playing) {
        menuPlayer.play();
      }
      return;
    }

    const player = createAudioPlayer(SOUNDS.menu);
    player.loop = true;
    player.volume = 0.28;
    player.play();
    menuPlayer = player;
  } catch (e) {
    console.warn('[audio] menu music failed', e);
  }
}

export async function stopMenuMusic(): Promise<void> {
  if (!menuPlayer) return;
  try {
    menuPlayer.pause();
    menuPlayer.remove();
  } catch (e) {
    console.warn('[audio] stop menu failed', e);
  } finally {
    menuPlayer = null;
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
  playOneShot(SOUNDS.victory, 0.55);
}

export async function playMilestoneFanfare(onFinish?: () => void): Promise<void> {
  playOneShot(SOUNDS.milestone, 0.65, onFinish);
}

export async function playCelebration(hasMilestone: boolean): Promise<void> {
  await stopMenuMusic();
  if (hasMilestone) {
    playMilestoneFanfare(() => void playVictoryStinger());
  } else {
    await playVictoryStinger();
  }
}
