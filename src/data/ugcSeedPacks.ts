import type { Category, UgcPack } from '../types';
import { CATEGORY_LIST } from '../lib/categoryTheme';

type PackSeed = Omit<UgcPack, 'status' | 'createdAt'>;

const FREE_Q = [
  ...Array.from({ length: 42 }, (_, i) => `q${i + 1}`),
  ...Array.from({ length: 20 }, (_, i) => `ex${i + 1}`),
];

const PRO_Q = [
  'p1930-1', 'p1930-2', 'p1930-3', 'p1930-4', 'p1930-5',
  'p1940-1', 'p1940-2', 'p1940-3', 'p1940-4', 'p1940-5',
  'p1950-1', 'p1950-2', 'p1950-3', 'p1950-4', 'p1950-5',
  'p1960-1', 'p1960-2', 'p1960-3', 'p1960-4', 'p1960-5',
  'p1970-1', 'p1970-2', 'p1970-3', 'p1970-4', 'p1970-5',
  'p1980-1', 'p1980-2', 'p1980-3', 'p1980-4', 'p1980-5',
  'p1990-1', 'p1990-2', 'p1990-3', 'p1990-4', 'p1990-5',
  'p2000-1', 'p2000-2', 'p2000-3', 'p2000-4', 'p2000-5',
  'p2010-1', 'p2010-2', 'p2010-3', 'p2010-4', 'p2010-5',
  'p2020-1', 'p2020-2', 'p2020-3', 'p2020-4', 'p2020-5', 'p2020-6', 'p2020-7', 'p2020-8',
  'px-1', 'px-2', 'px-3', 'px-4', 'px-5', 'px-6', 'px-7', 'px-8', 'px-9', 'px-10',
];

const MIXED_Q = [...FREE_Q, ...PRO_Q];

function slicePool(pool: readonly string[], start: number, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(pool[(start + i) % pool.length]);
  return out;
}

const FREE_TITLES = [
  'Starter Mix', 'Quick Blitz', 'Friday Night', 'Brain Warm-Up', 'Classic Night',
  'Around the World', 'Movie Quotes', 'Nature Hits', 'Science Basics', 'History Highlights',
  'Sports Corner', 'Pop Pulse', 'Art Masters', 'Lit Shelf', 'Tech Trivia', 'Music Notes',
  'General Mashup', 'Weekend Warrior', 'Lunch Break Quiz', 'After School', 'Family Feud Lite',
  'Campus Challenge', 'Road Trip Trivia', 'Coffee Break', 'Sunset Showdown', 'Morning Mind',
  'Night Owl Pack', 'Rainy Day', 'Sunny Saturday', 'Study Break', 'Pub Quiz Free',
  'Trivia Newbie', 'Warm-Up Rounds', 'Speed Sprint', 'Category Crawl', 'Mixed Bag',
  'Quick Fire', 'Easy Mode', 'Rookie Run', 'Daily Driver', 'Community Pick',
];

const PRO_TITLES = [
  'Decades Deep', 'Cinema Vault', 'Lab Legends', 'Atlas Explorer', 'Hall of Fame',
  'Gallery Masters', 'Pulitzer Pages', 'Silicon Stories', 'Grammy Greats', 'Wild Planet',
  'Viral Vault', 'World War Era', 'Ancient Worlds', 'Space Race', 'Invention Island',
  'Olympic Moments', 'Rock Road', '90s Blockbusters', 'European Capitals+', 'Myth & Legend',
  'Picture Perfect', 'Business Titans', 'Medical Milestones', 'Food World', 'Gaming Gen',
  'Mega Mix Ultimate', 'Late Night Legends', 'Scholar Challenge', 'Speed Elite', 'Archive Gold',
  'Pro Deep Cut', 'Elite Edition', 'Championship', 'Master Class', 'Diamond Tier',
  'Platinum Mix', 'Ultimate Vault', 'Legends Only', 'Hard Mode', 'Expert Run',
  'Pro Blitz', 'Night Shift Pro', 'Weekend Pro', 'Turbo Trivia', 'Brain Buster Pro',
  'Global Gauntlet', 'Time Machine', 'Century Sweep', 'Headliner Pack', 'Showstopper',
  'Premium Pulse', 'Gold Standard', 'Black Label', 'Director\'s Cut', 'Encore Edition',
  'Victory Lap', 'Crown Jewels', 'Heavyweight', 'Main Event', 'Grand Slam',
  'All-Star', 'Hall Pass Pro', 'Infinity Mix', 'Omega Pack', 'Alpha Challenge',
  'Summit Series', 'Apex Archive', 'Prime Time Pro', 'Ultra Mix', 'Max Difficulty',
  'Pro Circuit', 'Elite League', 'Champion\'s Choice', 'Power User', 'Deep Archive',
  'Rare Cuts', 'Collector\'s', 'Limited Run', 'Signature Series', 'Flagship Pack',
];

const AUTHORS_FREE = ['TriviaDash', 'Community', 'Players', 'Quiz Club', 'Dash Crew'];
const AUTHORS_PRO = ['TriviaDash Pro', 'Archive', 'Community+', 'Elite', 'Premium'];

function buildFreePacks(): PackSeed[] {
  const packs: PackSeed[] = [];
  for (let i = 0; i < FREE_TITLES.length; i++) {
    const cat = CATEGORY_LIST[i % CATEGORY_LIST.length] as Category;
    const qCount = 8 + (i % 7);
    packs.push({
      id: `ugc_free_${String(i + 1).padStart(3, '0')}`,
      tier: 'free',
      title: FREE_TITLES[i],
      author: AUTHORS_FREE[i % AUTHORS_FREE.length],
      category: cat,
      questionIds: slicePool(FREE_Q, i * 3, qCount),
    });
  }
  return packs;
}

function buildProPacks(): PackSeed[] {
  const packs: PackSeed[] = [];
  for (let i = 0; i < PRO_TITLES.length; i++) {
    const cat = CATEGORY_LIST[(i * 2) % CATEGORY_LIST.length] as Category;
    const qCount = 12 + (i % 9);
    const pool = i % 3 === 0 ? MIXED_Q : i % 3 === 1 ? PRO_Q : FREE_Q;
    packs.push({
      id: `ugc_pro_${String(i + 1).padStart(3, '0')}`,
      tier: 'pro',
      title: PRO_TITLES[i],
      author: AUTHORS_PRO[i % AUTHORS_PRO.length],
      category: cat,
      questionIds: slicePool(pool, i * 5, qCount),
    });
  }
  return packs;
}

const RAW: PackSeed[] = [...buildFreePacks(), ...buildProPacks()];

function stamp(p: PackSeed, offset: number): UgcPack {
  return {
    ...p,
    status: 'approved',
    createdAt: Date.now() - offset * 3600000,
  };
}

export const FREE_UGC_SEED_PACKS: UgcPack[] = RAW.filter((p) => p.tier === 'free').map((p, i) =>
  stamp(p, i + 1)
);

export const PRO_UGC_SEED_PACKS: UgcPack[] = RAW.filter((p) => p.tier === 'pro').map((p, i) =>
  stamp(p, i + 100)
);

export const ALL_UGC_SEED_PACKS: UgcPack[] = [...FREE_UGC_SEED_PACKS, ...PRO_UGC_SEED_PACKS];
