/** Voice pack definitions — 3 free + 250 premium. */

export const OPENAI_VOICES = [
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'fable',
  'onyx',
  'nova',
  'sage',
  'shimmer',
  'verse',
] as const;

export type OpenAIVoice = (typeof OPENAI_VOICES)[number];

export type VoiceTier = 'free' | 'premium';

export interface VoicePackDef {
  id: string;
  tier: VoiceTier;
  label: string;
  hint: string;
  pitch: number;
  rate: number;
  gender: 'male' | 'female' | 'any';
  /** OpenAI neural voice (when cloud TTS is enabled). */
  aiVoice?: OpenAIVoice;
  aiSpeed?: number;
  /** Spoken before the question (Steve Harvey style). */
  intros?: string[];
  harveyStyle?: boolean;
}

const FREE_CORE: VoicePackDef[] = [
  {
    id: 'host',
    tier: 'free',
    label: 'Normal Host',
    hint: 'Quick, clear read-aloud',
    pitch: 1,
    rate: 1.1,
    gender: 'any',
    aiVoice: 'echo',
    aiSpeed: 1.05,
  },
  {
    id: 'harvey',
    tier: 'free',
    label: 'Game Show Host (Classic)',
    hint: 'Slower classic TV style',
    pitch: 0.9,
    rate: 0.95,
    gender: 'male',
    aiVoice: 'onyx',
    aiSpeed: 0.95,
  },
  {
    id: 'scholar',
    tier: 'free',
    label: 'Quiz Scholar',
    hint: 'Clear & measured',
    pitch: 1.08,
    rate: 0.8,
    gender: 'any',
    aiVoice: 'nova',
    aiSpeed: 0.94,
  },
];

const PREMIUM_ADJECTIVES = [
  'Velvet', 'Neon', 'Midnight', 'Golden', 'Silver', 'Cosmic', 'Royal', 'Urban',
  'Classic', 'Bold', 'Smooth', 'Crisp', 'Warm', 'Cool', 'Epic', 'Prime', 'Elite',
  'Studio', 'Arena', 'Vintage', 'Modern', 'Crystal', 'Thunder', 'Silk', 'Iron',
];

const PREMIUM_ROLES = [
  'Host', 'Announcer', 'Narrator', 'MC', 'Anchor', 'Commentator', 'Presenter',
  'Showcaller', 'Ringmaster', 'Emcee', 'Broadcaster', 'Storyteller',
];

function buildPremiumPacks(): VoicePackDef[] {
  const packs: VoicePackDef[] = [];
  for (let i = 1; i <= 250; i++) {
    const adj = PREMIUM_ADJECTIVES[i % PREMIUM_ADJECTIVES.length];
    const role = PREMIUM_ROLES[(i * 3) % PREMIUM_ROLES.length];
    const gender: VoicePackDef['gender'] = i % 5 === 0 ? 'female' : i % 5 === 1 ? 'male' : 'any';
    const rate = 0.66 + ((i * 11) % 35) * 0.011;
    packs.push({
      id: `pro_${String(i).padStart(3, '0')}`,
      tier: 'premium',
      label: `${adj} ${role}`,
      hint: `Premium neural voice #${i}`,
      pitch: 0.52 + ((i * 7) % 40) * 0.018,
      rate,
      gender,
      aiVoice: OPENAI_VOICES[i % OPENAI_VOICES.length],
    });
  }
  return packs;
}

const PREMIUM_PACKS = buildPremiumPacks();

const ALL_PACKS: VoicePackDef[] = [...FREE_CORE, ...PREMIUM_PACKS];

const PACK_MAP = new Map(ALL_PACKS.map((p) => [p.id, p]));

export const VOICE_PACK_COUNT = ALL_PACKS.length;
export const PREMIUM_VOICE_COUNT = PREMIUM_PACKS.length;

export function getVoicePack(id: string): VoicePackDef {
  return PACK_MAP.get(id) ?? PACK_MAP.get('host')!;
}

export function isPremiumVoicePack(id: string): boolean {
  return getVoicePack(id).tier === 'premium';
}

export function isHarveyStylePack(id: string): boolean {
  return getVoicePack(id).harveyStyle === true;
}

export function listFreeVoicePacks(): VoicePackDef[] {
  return FREE_CORE;
}

export function listPremiumVoicePacks(): VoicePackDef[] {
  return PREMIUM_PACKS;
}

export function listAllVoicePacks(): VoicePackDef[] {
  return ALL_PACKS;
}

export function listVoicePacksForUser(isPro: boolean): VoicePackDef[] {
  return isPro ? ALL_PACKS : FREE_CORE;
}

export function clampVoicePackId(id: string | undefined, isPro: boolean): string {
  const safe = id && PACK_MAP.has(id) ? id : 'host';
  if (!isPro && isPremiumVoicePack(safe)) return 'host';
  return safe;
}
