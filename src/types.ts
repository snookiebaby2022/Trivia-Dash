export type Category =
  | 'General'
  | 'Science'
  | 'History'
  | 'Geography'
  | 'Sports'
  | 'Entertainment'
  | 'Pop Culture';

export type QuestionTier = 'free' | 'pro';

export interface Question {
  id: string;
  category: Category;
  prompt: string;
  options: string[];
  answer: number;
  year?: number;
  tier: QuestionTier;
}

export interface AvatarConfig {
  emoji: string;
  color: string;
  frame: AvatarFrame;
  badge: AvatarBadge;
}

export type AvatarFrame = 'none' | 'classic' | 'gold' | 'silver' | 'neon' | 'star';
export type AvatarBadge = 'none' | 'crown' | 'star' | 'fire' | 'bolt' | 'gem' | 'trophy' | 'party';

export type VoicePreset = 'host' | 'announcer' | 'scholar' | 'coach' | 'robot';

export interface ProfileStats {
  matchesPlayed: number;
  totalCorrect: number;
  categoryCorrect: Partial<Record<Category, number>>;
  partyWins: number;
  passPlayWins: number;
}

export interface AchievementState {
  unlocked: string[];
  progress: Record<string, number>;
  cosmeticUnlocks: {
    frames: AvatarFrame[];
    badges: AvatarBadge[];
  };
}

export interface Profile {
  id: string;
  username: string;
  avatar: AvatarConfig;
  voicePreset: VoicePreset;
  voiceEnabled: boolean;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  bestStreak: number;
  streak: number;
  isPro: boolean;
  dailyStreak: number;
  lastDailyDate?: string;
  /** Date key when a rewarded ad granted a bonus daily run. */
  dailyExtraPlayDate?: string;
  /** Protects daily streak once if a day is missed. */
  streakShield: boolean;
  achievementState: AchievementState;
  stats: ProfileStats;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  elo: number;
  wins: number;
  rank: number;
  avatar?: AvatarConfig;
}

export interface RoundResult {
  questionId: string;
  selected: number | null;
  correct: boolean;
  ms: number;
  points: number;
}

export type PlayerStatus = 'idle' | 'thinking' | 'answered' | 'correct' | 'wrong' | 'timeout';

/** Per-player stats updated live during a match. */
export interface PlayerLiveStats {
  id: string;
  name: string;
  avatar: AvatarConfig;
  isYou: boolean;
  isBot?: boolean;
  score: number;
  correct: number;
  answered: number;
  totalQuestions: number;
  streak: number;
  avgMs: number;
  lastMs?: number;
  lastPoints?: number;
  status: PlayerStatus;
  rank: number;
}

export type MatchMode = 'solo' | 'quick' | 'party' | 'daily' | 'quad' | 'passplay';

export type BotDifficulty = 'easy' | 'medium' | 'hard' | 'very_hard' | 'unbeatable';

export interface GhostConfig {
  name: string;
  elo: number;
  accuracy: number;
  speedMs: [number, number];
  difficulty?: BotDifficulty;
  blankChance?: number;
}

export interface Competitor {
  id: string;
  name: string;
  avatar: AvatarConfig;
  isBot: boolean;
  isYou: boolean;
  score: number;
  elo?: number;
  ghost?: GhostConfig;
}

export interface CompetitorStanding {
  id: string;
  name: string;
  avatar: AvatarConfig;
  score: number;
  rank: number;
  isYou: boolean;
  isBot: boolean;
}

export interface OpponentInfo {
  id: string;
  name: string;
  avatar: AvatarConfig;
  elo: number;
  isHuman: boolean;
}

export interface MilestoneHit {
  kind: string;
  label: string;
  emoji: string;
}

export interface MatchSummary {
  you: number;
  opponent: number;
  opponentName: string;
  opponentAvatar?: AvatarConfig;
  rounds: RoundResult[];
  outcome: 'win' | 'loss' | 'draw';
  eloDelta: number;
  newElo: number;
  mode: MatchMode;
  isOnline: boolean;
  shareGrid?: string;
  partyRank?: number;
  partySize?: number;
  standings?: CompetitorStanding[];
  botDifficulty?: BotDifficulty;
  collectedWedges?: Category[];
  milestones?: MilestoneHit[];
  achievementUnlocks?: MilestoneHit[];
}

export interface PartyReaction {
  id: string;
  playerId: string;
  playerName: string;
  emoji: string;
  at: number;
}

export interface PassPlayPlayer {
  id: string;
  name: string;
  avatar: AvatarConfig;
  score: number;
}

export interface PartyPlayer {
  playerId: string;
  username: string;
  avatar: AvatarConfig;
  elo: number;
  score: number;
  ready: boolean;
  isHost: boolean;
}

export interface PartyLobby {
  id: string;
  code: string;
  hostId: string;
  status: 'waiting' | 'starting' | 'playing' | 'done';
  questionSeed: number;
  players: PartyPlayer[];
  maxPlayers: number;
}

export interface OnlineMatch {
  id: string;
  questionSeed: number;
  opponent: OpponentInfo;
}

export interface DailyChallengeInfo {
  dateKey: string;
  questionIds: string[];
  globalBest?: number;
  yourBest?: number;
}
