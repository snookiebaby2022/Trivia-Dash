/**
 * Headless smoke tests — core logic + static checks (no device required).
 * Run: npx tsx scripts/smoke-test.ts
 */
import fs from 'fs';
import path from 'path';

import { pickMatchQuestions } from '../src/data/questions';
import { getDailyChallenge } from '../src/lib/daily';
import { canPracticeToday } from '../src/lib/categoryStats';
import { practiceLimit } from '../src/lib/entitlements';
import { getWeeklyEvent } from '../src/lib/weeklyEvent';
import { isAiVoiceAvailable, resolveAiVoice } from '../src/lib/aiVoiceConfig';
import { CATEGORY_LIST } from '../src/lib/categoryTheme';
import { getVoicePack, OPENAI_VOICES, PREMIUM_VOICE_COUNT } from '../src/lib/voiceCatalog';
import { FREE_UGC_SEED_PACKS, PRO_UGC_SEED_PACKS } from '../src/data/ugcSeedPacks';
import { packQuestionSeed } from '../src/lib/ugc';
import { SEASON_LEVEL_COUNT, seasonXpProgress, WINS_PER_XP_GAIN, XP_PER_LEVEL } from '../src/lib/seasonPass';
import { countEarnedWedges } from '../src/lib/wedges';
import { defaultProfileStats } from '../src/lib/achievements';
import type { Profile } from '../src/types';

type Check = { name: string; pass: boolean; detail?: string };

const checks: Check[] = [];

function assert(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
}

function mockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'smoke_user',
    username: 'SmokeTest',
    avatar: { emoji: '🧪', color: '#7C5CFF', frame: 'classic', badge: 'none' },
    voicePreset: 'host',
    voiceEnabled: false,
    elo: 1000,
    wins: 0,
    losses: 0,
    draws: 0,
    bestStreak: 0,
    streak: 0,
    isPro: false,
    dailyStreak: 0,
    streakShield: false,
    achievementState: {
      unlocked: [],
      progress: {},
      cosmeticUnlocks: { frames: [], badges: [] },
    },
    stats: defaultProfileStats(),
    ...overrides,
  };
}

// --- Static: HomeScreen hooks order (v6 crash fix) ---
const homePath = path.join(process.cwd(), 'src/screens/HomeScreen.tsx');
const homeSrc = fs.readFileSync(homePath, 'utf8');
const loadingGuard = homeSrc.indexOf('if (loading || !profile)');
const reminderEffect = homeSrc.indexOf('shouldShowDailyReminder');
assert(
  'HomeScreen: daily reminder effect before loading guard',
  reminderEffect > 0 && loadingGuard > 0 && reminderEffect < loadingGuard,
  `effect@${reminderEffect} guard@${loadingGuard}`
);

// --- Static: ShareCard uses legacy filesystem ---
const sharePath = path.join(process.cwd(), 'src/context/ShareCardProvider.tsx');
const shareSrc = fs.readFileSync(sharePath, 'utf8');
assert(
  'ShareCardProvider: expo-file-system/legacy import',
  shareSrc.includes("expo-file-system/legacy"),
);

// --- Neural voice catalog ---
assert('OpenAI voices: 11 neural options', OPENAI_VOICES.length === 11);
assert('Premium voices: 250 packs', PREMIUM_VOICE_COUNT === 250);
assert('Category wedges: 18 categories', CATEGORY_LIST.length === 18);
const hostAi = resolveAiVoice(getVoicePack('host'));
assert('Host pack: mapped to echo', hostAi.voice === 'echo');
assert(
  'AI voice: availability is boolean',
  typeof isAiVoiceAvailable() === 'boolean'
);

assert('Season pass: 100 levels', SEASON_LEVEL_COUNT === 100);
assert('Season pass: 1000 XP per level', XP_PER_LEVEL === 1000);
assert('Season pass: 10 wins per XP', WINS_PER_XP_GAIN === 10);
const xpProg = seasonXpProgress(2500);
assert('Season XP progress: level 3 at 2500', xpProg.level === 3 && xpProg.xpInLevel === 500);

// --- Questions ---
const soloQs = pickMatchQuestions(7, 42, { isPro: false });
assert('pickMatchQuestions: solo returns 7', soloQs.length === 7);
assert('pickMatchQuestions: all have options', soloQs.every((q) => q.options.length === 4));

const ugcIds = ['q4', 'q17', 'q30'];
const ugcQs = pickMatchQuestions(15, packQuestionSeed('ugc_free_001'), {
  isPro: false,
  questionIds: ugcIds,
});
assert('UGC pack: resolves question ids', ugcQs.length === ugcIds.length);
assert('UGC pack: stable seed', packQuestionSeed('ugc_free_001') === packQuestionSeed('ugc_free_001'));
assert('UGC free packs: 40+', FREE_UGC_SEED_PACKS.length >= 40);
assert('UGC pro packs: 80+', PRO_UGC_SEED_PACKS.length >= 80);

// --- Daily ---
const daily = getDailyChallenge(false);
assert('Daily challenge: 10 question ids', daily.questionIds.length === 10);

// --- Practice limits ---
const freeProfile = mockProfile();
assert('Practice: free limit is 3', practiceLimit(false) === 3);
assert('Practice: can play on fresh profile', canPracticeToday(freeProfile, 3));

// --- Wedges ---
assert('Wedges: zero earned on fresh profile', countEarnedWedges(freeProfile) === 0);

// --- Weekly event ---
const weekly = getWeeklyEvent();
assert('Weekly event: has category', Boolean(weekly.category));
assert('Weekly event: has label', Boolean(weekly.label));

// --- Android bundle artifact from export ---
const bundleDir = path.join(process.cwd(), 'dist-smoke-test/_expo/static/js/android');
const bundles = fs.existsSync(bundleDir)
  ? fs.readdirSync(bundleDir).filter((f) => f.endsWith('.hbc') || f.endsWith('.js'))
  : [];
assert('Android bundle export exists', bundles.length > 0, bundles.join(', ') || 'missing');

// --- Report ---
const failed = checks.filter((c) => !c.pass);
for (const c of checks) {
  const mark = c.pass ? '✓' : '✗';
  console.log(`${mark} ${c.name}${c.detail ? ` (${c.detail})` : ''}`);
}
console.log(`\n${checks.length - failed.length}/${checks.length} passed`);
if (failed.length > 0) process.exit(1);
