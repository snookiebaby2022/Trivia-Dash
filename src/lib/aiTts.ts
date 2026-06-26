import { createAudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';

import {
  getTtsAuthHeader,
  getTtsEndpoint,
  isAiVoiceAvailable,
  resolveAiVoiceForPackId,
} from './aiVoiceConfig';

export type { OpenAIVoice } from './voiceCatalog';
export { OPENAI_VOICES } from './voiceCatalog';
export {
  isAiVoiceAvailable,
  rateToAiSpeed,
  resolveAiVoice,
} from './aiVoiceConfig';

let activePlayer: ReturnType<typeof createAudioPlayer> | null = null;
let activeSub: { remove: () => void } | null = null;

function hashText(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

async function cacheDir(): Promise<string> {
  const dir = `${FileSystem.cacheDirectory}tts/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  return dir;
}

async function cachedPath(packId: string, text: string): Promise<string> {
  const dir = await cacheDir();
  return `${dir}${packId}_${hashText(text)}.mp3`;
}

async function fetchNeuralAudio(
  text: string,
  voice: string,
  speed: number
): Promise<ArrayBuffer | null> {
  const endpoint = getTtsEndpoint();
  const auth = getTtsAuthHeader();
  if (!endpoint || !auth) return null;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text.slice(0, 4096), voice, speed }),
    });
    if (!res.ok) {
      console.warn('[aiTts] synthesis failed', res.status);
      return null;
    }
    return await res.arrayBuffer();
  } catch (e) {
    console.warn('[aiTts] network error', e);
    return null;
  }
}

async function ensureCachedAudio(
  packId: string,
  text: string,
  voice: string,
  speed: number
): Promise<string | null> {
  const path = await cachedPath(packId, text);
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) return path;

  const audio = await fetchNeuralAudio(text, voice, speed);
  if (!audio || audio.byteLength < 64) return null;

  await FileSystem.writeAsStringAsync(path, arrayBufferToBase64(audio), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return path;
}

export function stopAiSpeech(): void {
  if (activeSub) {
    activeSub.remove();
    activeSub = null;
  }
  if (activePlayer) {
    try {
      activePlayer.pause();
      activePlayer.remove();
    } catch {
      /* player may already be gone */
    }
    activePlayer = null;
  }
}

function playFile(uri: string): Promise<void> {
  return new Promise((resolve) => {
    stopAiSpeech();
    try {
      const player = createAudioPlayer({ uri });
      activePlayer = player;
      player.volume = 1;

      const sub = player.addListener('playbackStatusUpdate', (status) => {
        if (!status.didJustFinish) return;
        sub.remove();
        activeSub = null;
        try {
          player.remove();
        } catch {
          /* ignore */
        }
        if (activePlayer === player) activePlayer = null;
        resolve();
      });
      activeSub = sub;
      player.play();
    } catch (e) {
      console.warn('[aiTts] playback failed', e);
      resolve();
    }
  });
}

/** Synthesize (or load cache) and play neural speech. Returns false if unavailable or failed. */
export async function speakNeural(text: string, packId: string): Promise<boolean> {
  if (!isAiVoiceAvailable() || !text.trim()) return false;

  const { voice, speed } = resolveAiVoiceForPackId(packId);
  const uri = await ensureCachedAudio(packId, text, voice, speed);
  if (!uri) return false;

  await playFile(uri);
  return true;
}
