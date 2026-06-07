import * as Speech from 'expo-speech';

import type { VoicePreset } from '../types';

export interface VoiceSettings {
  preset: VoicePreset;
  enabled: boolean;
}

export const DEFAULT_VOICE: VoiceSettings = {
  preset: 'host',
  enabled: true,
};

export type { VoicePreset };

export const VOICE_PRESETS: Record<
  VoicePreset,
  { label: string; hint: string; pitch: number; rate: number }
> = {
  host: {
    label: 'Game Show Host',
    hint: 'Warm & punchy — classic TV trivia',
    pitch: 1.0,
    rate: 0.9,
  },
  announcer: {
    label: 'Ring Announcer',
    hint: 'Deep booming voice',
    pitch: 0.78,
    rate: 0.95,
  },
  scholar: {
    label: 'Quiz Scholar',
    hint: 'Clear & measured',
    pitch: 1.12,
    rate: 0.82,
  },
  coach: {
    label: 'Sports Coach',
    hint: 'Energetic & fast',
    pitch: 0.92,
    rate: 1.05,
  },
  robot: {
    label: 'Trivia Bot',
    hint: 'Synthetic android reader',
    pitch: 0.55,
    rate: 0.88,
  },
};

export const VOICE_ORDER: VoicePreset[] = ['host', 'announcer', 'scholar', 'coach', 'robot'];

let speaking = false;

export function stopSpeaking(): void {
  Speech.stop();
  speaking = false;
}

export async function speakQuestion(
  text: string,
  settings: VoiceSettings = DEFAULT_VOICE
): Promise<void> {
  if (!settings.enabled) return;
  stopSpeaking();
  const v = VOICE_PRESETS[settings.preset];
  speaking = true;
  return new Promise((resolve) => {
    Speech.speak(text, {
      pitch: v.pitch,
      rate: v.rate,
      language: 'en-US',
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
}

export async function speakLine(
  text: string,
  settings: VoiceSettings,
  pitchOffset = 0
): Promise<void> {
  if (!settings.enabled) return;
  const v = VOICE_PRESETS[settings.preset];
  Speech.speak(text, {
    pitch: v.pitch + pitchOffset,
    rate: v.rate,
    language: 'en-US',
  });
}

export function isSpeaking(): boolean {
  return speaking;
}
