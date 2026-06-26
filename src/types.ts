export type Category =
  | 'General'
  | 'Science'
  | 'History'
  | 'Geography'
  | 'Sports'
  | 'Entertainment'
  | 'Pop Culture'
  | 'Art'
  | 'Literature'
  | 'Technology'
  | 'Nature'
  | 'Music'
  | 'Movies'
  | 'Food'
  | 'Animals'
  | 'Politics'
  | 'Space'
  | 'Mythology';

export type QuestionTier = 'free' | 'pro';

export interface Question {
  id: string;
  category: Category;
  prompt: string;
  options: string[];
  answer: number;
  year?: number;
  tier: QuestionTier;
  /** Pro picture round — remote image URL. */
  imageUrl?: string;
  /** User-created pack id when applicable. */
  packId?: string;
}

export interface AvatarConfig {
  emoji: string;
  color: string;
  frame: AvatarFrame;
  badge: AvatarBadge;
}

export type AvatarFrame = 'none' | 'classic' | 'gold' | 'silver' | 'neon' | 'star';
export type AvatarBadge = 'none' | 'crown' | 'star' | 'fire' | 'bolt' | 'gem' | 'trophy' | 'party';

/** Voice pack id — see voiceCatalog.ts (3 free + 250 premium). */
export type VoicePreset = string;

export interface CategoryPlayStats {
  plays: number;
  bestStreak: number;
}

export interface ProfileStats {
  matchesPlayed: number;
  totalCorrect: number;
  categoryCorrect: Partial<Record<Category, number>>;
  categoryPlays: Partial<Record<Category, CategoryPlayStats>>;
  partyWins: number;
  passPlayWins: number;
  quadWins?: number;
  seasonXp: number;
  /** dateKey → best daily score */
  dailyBests: Record<string, number>;
  /** ISO date of last practice day + count */
  practiceDay?: string;
  practiceCountToday?: number;
  dailyReminderEnabled?: boolean;
}

export interface AchievementState {
  unlocked: string[];
  progress: Record<string, number>;
  cosmeticUnlocks: {
    frames: AvatarFrame[];
    badges: AvatarBadge[];
  };
}

export type AuthProvider = 'google' | 'email' | 'apple' | 'facebook';

export interface Profile {
  id: string;
  username: string;
  email?: string;
  authProvider?: AuthProvider;
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
  seasonPass?: SeasonPassProgress;
  /** Local file:// or remote https URL for profile picture. */
  profilePhotoUri?: string;
  /** Local file:// or remote https URL for cover / banner image. */
  coverPhotoUri?: string;
}

export interface SeasonPassProgress {
  seasonId: string;
  xp: number;
  /** Wins counting toward the next +XP (need 10). */
  winsTowardXp?: number;
  claimedFree: number[];
  claimedPro: number[];
}

export interface DailyLeaderboardEntry {
  id: string;
  username: string;
  score: number;
  rank?: number;
  avatar?: AvatarConfig;
  isYou?: boolean;
}

export interface UgcPack {
  id: string;
  title: string;
  author: string;
  category: Category;
  questionIds: string[];
  status: 'pending' | 'approved' | 'rejected';
  tier?: 'free' | 'pro';
  createdAt: number;
}

export interface FriendPartyRoom {
  code: string;
  hostName: string;
  hostId: string;
  mode: 'party' | 'livehost';
  questionSeed: number;
  maxPlayers: number;
  players: { id: string; name: string }[];
  createdAt: number;
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

export type MatchMode =
  | 'solo'
  | 'quick'
  | 'ranked'
  | 'practice'
  | 'party'
  | 'daily'
  | 'quad'
  | 'passplay'
  | 'livehost'
  | 'friendparty';

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

export interface SeasonXpSnapshot {
  level: number;
  xp: number;
  xpInLevel: number;
  xpToNextLevel: number;
  xpDelta: number;
  wins: number;
  losses: number;
  winsTowardXp: number;
  leveledUp: boolean;
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
  seasonXp?: SeasonXpSnapshot;
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
