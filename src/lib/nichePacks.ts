import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Category } from '../types';

export type NichePackTheme =
  | 'anime' | 'kpop' | 'marvel' | 'dc' | 'star_wars' | 'potter'
  | 'gaming' | 'nfl' | 'nba' | 'soccer' | 'taylor_swift' | 'beyonce'
  | 'disney' | 'pixar' | 'lord_of_rings' | 'stranger_things'
  | 'the_office' | 'friends_tv' | 'breaking_bad' | 'game_of_thrones'
  | 'true_crime' | 'conspiracy' | 'internet_culture' | 'food_network'
  | 'craft_beer' | 'wrestling' | 'f1' | 'olympics';

export interface NichePack {
  id: string;
  theme: NichePackTheme;
  title: string;
  subtitle: string;
  emoji: string;
  category: Category;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  tier: 'free' | 'pro';
  isUnlocked: boolean;
  playerCount: number;
  avgScore: number;
  tags: string[];
}

export interface NichePackLeaderboard {
  packId: string;
  topScores: { playerName: string; score: number; avatar: string }[];
  yourBest?: number;
}

const STORAGE_KEY = 'bb.niche_packs.v1';

const MOCK_NAMES = [
  'QuizMaster', 'TriviaQueen', 'Brainiac99', 'FactHunter', 'TriviaNerd',
  'KnowledgeKing', 'TriviaStar', 'QuizWhiz', 'FactFrenzy', 'TriviAddict',
  'PuzzlePro', 'BrainBuster', 'SmartCookie', 'WizKid', 'TriviaGuru',
];

let packs: NichePack[] = [];
let initialized = false;

function defaultPacks(): NichePack[] {
  return [
    {
      id: 'niche_anime_essentials',
      theme: 'anime',
      title: 'Anime Essentials',
      subtitle: 'From Dragon Ball to Jujutsu Kaisen',
      emoji: '🎌',
      category: 'Entertainment',
      questionCount: 30,
      difficulty: 'mixed',
      tier: 'free',
      isUnlocked: true,
      playerCount: 4200,
      avgScore: 68,
      tags: ['anime', 'manga', 'japanese', 'shonen'],
    },
    {
      id: 'niche_kpop_legends',
      theme: 'kpop',
      title: 'K-Pop Legends',
      subtitle: 'BTS, BLACKPINK, and beyond',
      emoji: '🎤',
      category: 'Music',
      questionCount: 25,
      difficulty: 'medium',
      tier: 'free',
      isUnlocked: true,
      playerCount: 3100,
      avgScore: 72,
      tags: ['kpop', 'bts', 'blackpink', 'korean'],
    },
    {
      id: 'niche_marvel_cinematic',
      theme: 'marvel',
      title: 'Marvel Cinematic',
      subtitle: 'MCU trivia from Iron Man to Secret Wars',
      emoji: '🦸',
      category: 'Movies',
      questionCount: 40,
      difficulty: 'medium',
      tier: 'free',
      isUnlocked: true,
      playerCount: 4800,
      avgScore: 65,
      tags: ['marvel', 'mcu', 'superhero', 'avengers'],
    },
    {
      id: 'niche_dc_universe',
      theme: 'dc',
      title: 'DC Universe',
      subtitle: 'Batman, Superman, and the multiverse',
      emoji: '🦇',
      category: 'Movies',
      questionCount: 35,
      difficulty: 'hard',
      tier: 'pro',
      isUnlocked: false,
      playerCount: 1800,
      avgScore: 58,
      tags: ['dc', 'batman', 'superman', 'justice league'],
    },
    {
      id: 'niche_star_wars_saga',
      theme: 'star_wars',
      title: 'Star Wars Saga',
      subtitle: 'A long time ago in a galaxy far, far away...',
      emoji: '🚀',
      category: 'Movies',
      questionCount: 40,
      difficulty: 'mixed',
      tier: 'free',
      isUnlocked: true,
      playerCount: 3900,
      avgScore: 71,
      tags: ['star wars', 'jedi', 'sith', 'space'],
    },
    {
      id: 'niche_harry_potter',
      theme: 'potter',
      title: 'Harry Potter',
      subtitle: 'The wizarding world awaits',
      emoji: '🧙',
      category: 'Literature',
      questionCount: 35,
      difficulty: 'medium',
      tier: 'pro',
      isUnlocked: false,
      playerCount: 3500,
      avgScore: 74,
      tags: ['harry potter', 'hogwarts', 'wizard', 'magic'],
    },
    {
      id: 'niche_gaming_classics',
      theme: 'gaming',
      title: 'Gaming Classics',
      subtitle: 'From Mario to Elden Ring',
      emoji: '🎮',
      category: 'Entertainment',
      questionCount: 30,
      difficulty: 'mixed',
      tier: 'free',
      isUnlocked: true,
      playerCount: 2700,
      avgScore: 63,
      tags: ['gaming', 'video games', 'nintendo', 'playstation'],
    },
    {
      id: 'niche_nfl_legends',
      theme: 'nfl',
      title: 'NFL Legends',
      subtitle: 'Touchdowns, tackles, and trophies',
      emoji: '🏈',
      category: 'Sports',
      questionCount: 30,
      difficulty: 'hard',
      tier: 'pro',
      isUnlocked: false,
      playerCount: 1400,
      avgScore: 55,
      tags: ['nfl', 'football', 'super bowl', 'quarterback'],
    },
    {
      id: 'niche_taylor_swift',
      theme: 'taylor_swift',
      title: 'Taylor Swift Trivia',
      subtitle: 'Are you ready for it?',
      emoji: '✨',
      category: 'Music',
      questionCount: 25,
      difficulty: 'easy',
      tier: 'free',
      isUnlocked: true,
      playerCount: 4500,
      avgScore: 79,
      tags: ['taylor swift', 'eras tour', 'swifties', 'music'],
    },
    {
      id: 'niche_disney_pixar',
      theme: 'disney',
      title: 'Disney & Pixar',
      subtitle: 'Where dreams come true',
      emoji: '🏰',
      category: 'Entertainment',
      questionCount: 30,
      difficulty: 'easy',
      tier: 'free',
      isUnlocked: true,
      playerCount: 3800,
      avgScore: 82,
      tags: ['disney', 'pixar', 'animation', 'movies'],
    },
    {
      id: 'niche_true_crime',
      theme: 'true_crime',
      title: 'True Crime',
      subtitle: 'Cold cases and criminal minds',
      emoji: '🔍',
      category: 'History',
      questionCount: 25,
      difficulty: 'hard',
      tier: 'pro',
      isUnlocked: false,
      playerCount: 2100,
      avgScore: 52,
      tags: ['true crime', 'detective', 'mystery', 'forensics'],
    },
    {
      id: 'niche_internet_culture',
      theme: 'internet_culture',
      title: 'Internet Culture',
      subtitle: 'Memes, viral moments, and online history',
      emoji: '🌐',
      category: 'Pop Culture',
      questionCount: 25,
      difficulty: 'mixed',
      tier: 'free',
      isUnlocked: true,
      playerCount: 2900,
      avgScore: 67,
      tags: ['memes', 'viral', 'internet', 'social media'],
    },
  ];
}

export async function initNichePacks(): Promise<void> {
  if (initialized) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      packs = JSON.parse(raw);
    } else {
      packs = defaultPacks();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
    }
  } catch {
    packs = defaultPacks();
  }
  initialized = true;
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
  } catch {
    // best effort
  }
}

export function getAllNichePacks(): NichePack[] {
  return [...packs];
}

export function getNichePacksByTheme(theme: NichePackTheme): NichePack[] {
  return packs.filter((p) => p.theme === theme);
}

export function getFreeNichePacks(): NichePack[] {
  return packs.filter((p) => p.tier === 'free');
}

export function getPopularNichePacks(limit = 10): NichePack[] {
  return [...packs].sort((a, b) => b.playerCount - a.playerCount).slice(0, limit);
}

export function getNewNichePacks(limit = 5): NichePack[] {
  return [...packs].slice(-limit).reverse();
}

export function unlockPack(packId: string): boolean {
  const pack = packs.find((p) => p.id === packId);
  if (!pack) return false;
  if (pack.tier === 'pro') return false;
  pack.isUnlocked = true;
  void persist();
  return true;
}

export function isPackUnlocked(packId: string): boolean {
  const pack = packs.find((p) => p.id === packId);
  return pack?.isUnlocked ?? false;
}

interface PackCategoryMeta {
  theme: NichePackTheme;
  label: string;
  emoji: string;
}

const PACK_CATEGORIES: PackCategoryMeta[] = [
  { theme: 'anime', label: 'Anime', emoji: '🎌' },
  { theme: 'kpop', label: 'K-Pop', emoji: '🎤' },
  { theme: 'marvel', label: 'Marvel', emoji: '🦸' },
  { theme: 'dc', label: 'DC', emoji: '🦇' },
  { theme: 'star_wars', label: 'Star Wars', emoji: '🚀' },
  { theme: 'potter', label: 'Harry Potter', emoji: '🧙' },
  { theme: 'gaming', label: 'Gaming', emoji: '🎮' },
  { theme: 'nfl', label: 'NFL', emoji: '🏈' },
  { theme: 'nba', label: 'NBA', emoji: '🏀' },
  { theme: 'soccer', label: 'Soccer', emoji: '⚽' },
  { theme: 'taylor_swift', label: 'Taylor Swift', emoji: '✨' },
  { theme: 'beyonce', label: 'Beyonce', emoji: '🐝' },
  { theme: 'disney', label: 'Disney', emoji: '🏰' },
  { theme: 'pixar', label: 'Pixar', emoji: '🐠' },
  { theme: 'lord_of_rings', label: 'Lord of the Rings', emoji: '💍' },
  { theme: 'stranger_things', label: 'Stranger Things', emoji: '🔦' },
  { theme: 'the_office', label: 'The Office', emoji: '📋' },
  { theme: 'friends_tv', label: 'Friends', emoji: '☕' },
  { theme: 'breaking_bad', label: 'Breaking Bad', emoji: '🧪' },
  { theme: 'game_of_thrones', label: 'Game of Thrones', emoji: '🐉' },
  { theme: 'true_crime', label: 'True Crime', emoji: '🔍' },
  { theme: 'conspiracy', label: 'Conspiracy', emoji: '👁️' },
  { theme: 'internet_culture', label: 'Internet Culture', emoji: '🌐' },
  { theme: 'food_network', label: 'Food Network', emoji: '🍳' },
  { theme: 'craft_beer', label: 'Craft Beer', emoji: '🍺' },
  { theme: 'wrestling', label: 'Wrestling', emoji: '🤼' },
  { theme: 'f1', label: 'Formula 1', emoji: '🏎️' },
  { theme: 'olympics', label: 'Olympics', emoji: '🏅' },
];

export function getPackCategories(): PackCategoryMeta[] {
  return [...PACK_CATEGORIES];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomScore(avg: number, spread = 15): number {
  return Math.max(20, Math.min(100, avg + Math.floor(Math.random() * spread * 2) - spread));
}

export function getNichePackLeaderboard(packId: string): NichePackLeaderboard {
  const pack = packs.find((p) => p.id === packId);
  const topScores = MOCK_NAMES.map((name) => ({
    playerName: name,
    score: randomScore(pack?.avgScore ?? 65, 12),
    avatar: pick(['🦊', '🦉', '🐺', '🦁', '🐸', '🦄', '🐙', '🦖', '🐼', '🦩']),
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return {
    packId,
    topScores,
    yourBest: Math.floor(Math.random() * 40) + 50,
  };
}
