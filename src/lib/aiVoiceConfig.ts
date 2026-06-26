import {
  getVoicePack,
  OPENAI_VOICES,
  type OpenAIVoice,
  type VoicePackDef,
} from './voiceCatalog';
import { isSupabaseConfigured } from './supabase';

const AI_ENABLED = process.env.EXPO_PUBLIC_AI_VOICE_ENABLED === 'true';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** Map catalog rate (0.66–1.2) to OpenAI speed (0.8–1.15). */
export function rateToAiSpeed(rate: number): number {
  const clamped = Math.min(1.2, Math.max(0.66, rate));
  return 0.8 + ((clamped - 0.66) / (1.2 - 0.66)) * 0.35;
}

export function resolveAiVoice(pack: VoicePackDef): { voice: OpenAIVoice; speed: number } {
  if (pack.aiVoice) {
    return { voice: pack.aiVoice, speed: pack.aiSpeed ?? rateToAiSpeed(pack.rate) };
  }
  const voice = OPENAI_VOICES[hashId(pack.id) % OPENAI_VOICES.length];
  return { voice, speed: rateToAiSpeed(pack.rate) };
}

export function isAiVoiceAvailable(): boolean {
  return AI_ENABLED && isSupabaseConfigured && Boolean(SUPABASE_URL && SUPABASE_ANON);
}

export function getTtsEndpoint(): string | null {
  if (!isAiVoiceAvailable()) return null;
  return `${SUPABASE_URL}/functions/v1/tts`;
}

export function getTtsAuthHeader(): string | null {
  if (!SUPABASE_ANON) return null;
  return `Bearer ${SUPABASE_ANON}`;
}

export function resolveAiVoiceForPackId(packId: string): { voice: OpenAIVoice; speed: number } {
  return resolveAiVoice(getVoicePack(packId));
}
