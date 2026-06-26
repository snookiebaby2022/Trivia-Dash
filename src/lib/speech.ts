import * as Speech from 'expo-speech';

import {
  getVoicePack,
  isPremiumVoicePack,
  listFreeVoicePacks,
  PREMIUM_VOICE_COUNT,
} from './voiceCatalog';

export type VoicePreset = string;

export interface VoiceSettings {
  preset: VoicePreset;
  enabled: boolean;
}

export const DEFAULT_VOICE: VoiceSettings = {
  preset: 'host',
  enabled: false,
};

export { PREMIUM_VOICE_COUNT, listFreeVoicePacks };

/** Fast read-aloud for questions when voice is enabled. */
const QUESTION_SPEECH_RATE = 1.18;

let speaking = false;
let voiceCache: Speech.Voice[] | null = null;
let lastSpokenKey = '';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadVoices(): Promise<Speech.Voice[]> {
  if (voiceCache) return voiceCache;
  try {
    voiceCache = await Speech.getAvailableVoicesAsync();
  } catch {
    voiceCache = [];
  }
  return voiceCache;
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

async function pickDeviceVoice(packId: string, gender: 'male' | 'female' | 'any'): Promise<string | undefined> {
  const voices = await loadVoices();
  const english = voices.filter((v) => /en(-|_)/i.test(v.language));
  if (!english.length) return undefined;

  const maleHints = /male|daniel|james|david|fred|aaron|guy|ryan|tom/i;
  const femaleHints = /female|samantha|karen|victoria|zira|susan|kate|linda/i;

  let pool = english;
  if (gender === 'male') {
    const males = english.filter((v) => maleHints.test(`${v.name} ${v.identifier}`));
    if (males.length) pool = males;
  } else if (gender === 'female') {
    const females = english.filter((v) => femaleHints.test(`${v.name} ${v.identifier}`));
    if (females.length) pool = females;
  }

  const idx = hashId(packId) % pool.length;
  return pool[idx]?.identifier;
}

export function formatCelebrationLine(text: string, _preset: VoicePreset): string {
  return text;
}

export function formatResultVoiceLine(text: string, _preset: VoicePreset): string {
  return text;
}

export function stopSpeaking(): void {
  if (!speaking) return;
  Speech.stop();
  speaking = false;
}

function speakOnceDevice(
  text: string,
  packId: string,
  pitch: number,
  rate: number,
  gender: 'male' | 'female' | 'any'
): Promise<void> {
  return new Promise((resolve) => {
    void pickDeviceVoice(packId, gender).then((voice) => {
      speaking = true;
      Speech.speak(text, {
        pitch,
        rate,
        language: 'en-US',
        voice,
        onDone: () => {
          speaking = false;
          resolve();
        },
        onStopped: () => {
          speaking = false;
          resolve();
        },
        onError: () => {
          speaking = false;
          resolve();
        },
      });
    });
  });
}

export async function speakQuestion(
  text: string,
  settings: VoiceSettings = DEFAULT_VOICE
): Promise<void> {
  if (!settings.enabled) return;

  const pack = getVoicePack(settings.preset);
  const key = `${settings.preset}:${text}`;
  if (key === lastSpokenKey) return;
  lastSpokenKey = key;

  stopSpeaking();
  await wait(30);
  await speakOnceDevice(text, pack.id, 1, QUESTION_SPEECH_RATE, pack.gender);
}

export async function speakLine(
  text: string,
  settings: VoiceSettings,
  pitchOffset = 0
): Promise<void> {
  if (!settings.enabled) return;
  const pack = getVoicePack(settings.preset);
  const line = formatResultVoiceLine(text, settings.preset);
  const voice = await pickDeviceVoice(pack.id, pack.gender);
  Speech.speak(line, {
    pitch: 1 + pitchOffset,
    rate: QUESTION_SPEECH_RATE,
    language: 'en-US',
    voice,
  });
}

export function isSpeaking(): boolean {
  return speaking;
}

/** @deprecated use voiceCatalog */
export const VOICE_PRESETS: Record<string, { label: string; hint: string }> = {};
export const VOICE_ORDER: VoicePreset[] = ['host', 'scholar', 'harvey'];

export function isLegacyProVoice(id: string): boolean {
  return isPremiumVoicePack(id);
}
