import { CATEGORY_LIST } from './categoryTheme';
import { mergeRecentQuestionIds } from './questionHistory';
import { countEarnedWedges, WEDGE_UNLOCK_CORRECT } from './wedges';
import type {
  AchievementState,
  AvatarBadge,
  AvatarFrame,
  Category,
  MatchSummary,
  Profile,
} from '../types';

export type AchievementId =
  | 'first_win'
  | 'wins_5'
  | 'wins_10'
  | 'wins_25'
  | 'streak_3'
  | 'streak_5'
  | 'streak_10'
  | 'perfect_game'
  | 'all_wedges'
  | 'wedges_3'
  | 'wedges_6'
  | 'daily_7'
  | 'daily_30'
  | 'party_champion'
  | 'party_5'
  | 'matches_10'
  | 'matches_50'
  | 'science_savvy'
  | 'history_buff'
  | 'geo_guru'
  | 'pop_culture_fan'
  | 'correct_100'
  | 'correct_500'
  | 'elo_1200'
  | 'pass_play_champ'
  | 'pass_play_5'
  | 'quad_winner'
  | 'speed_round';

export interface AchievementDef {
  id: AchievementId;
  label: string;
  emoji: string;
  description: string;
  target: number;
  reward?: { frame?: AvatarFrame; badge?: AvatarBadge };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_win',
    label: 'First Win',
    emoji: '🏆',
    description: 'Win your first match',
    target: 1,
    reward: { badge: 'trophy' },
  },
  {
    id: 'wins_5',
    label: 'On a Roll',
    emoji: '🎯',
    description: 'Reach 5 career wins',
    target: 5,
    reward: { badge: 'fire' },
  },
  {
    id: 'wins_10',
    label: 'Trivia Regular',
    emoji: '⭐',
    description: 'Reach 10 career wins',
    target: 10,
    reward: { frame: 'silver' },
  },
  {
    id: 'wins_25',
    label: 'Hall of Fame',
    emoji: '🏛️',
    description: 'Reach 25 career wins',
    target: 25,
    reward: { frame: 'gold' },
  },
  {
    id: 'streak_3',
    label: 'Hot Streak',
    emoji: '🔥',
    description: 'Win 3 matches in a row',
    target: 3,
    reward: { badge: 'bolt' },
  },
  {
    id: 'streak_5',
    label: 'Unstoppable',
    emoji: '💥',
    description: 'Win 5 matches in a row',
    target: 5,
    reward: { frame: 'neon' },
  },
  {
    id: 'perfect_game',
    label: 'Perfect Game',
    emoji: '💯',
    description: 'Answer every question correctly in a match',
    target: 1,
    reward: { badge: 'gem' },
  },
  {
    id: 'wedges_3',
    label: 'Triple Threat',
    emoji: '🎯',
    description: `Earn 3 category wedges (${WEDGE_UNLOCK_CORRECT} correct each)`,
    target: 3,
    reward: { badge: 'bolt' },
  },
  {
    id: 'wedges_6',
    label: 'Half the Pie',
    emoji: '🥧',
    description: `Earn 6 category wedges (${WEDGE_UNLOCK_CORRECT} correct each)`,
    target: 6,
    reward: { frame: 'neon' },
  },
  {
    id: 'all_wedges',
    label: 'Rainbow Brain',
    emoji: '🌈',
    description: `Earn every category wedge (${WEDGE_UNLOCK_CORRECT} correct each)`,
    target: CATEGORY_LIST.length,
    reward: { frame: 'star' },
  },
  {
    id: 'daily_7',
    label: 'Daily Devotee',
    emoji: '📅',
    description: 'Reach a 7-day daily streak',
    target: 7,
    reward: { badge: 'party' },
  },
  {
    id: 'daily_30',
    label: 'Monthly Maven',
    emoji: '🗓️',
    description: 'Reach a 30-day daily streak',
    target: 30,
    reward: { badge: 'gem' },
  },
  {
    id: 'party_champion',
    label: 'Party Legend',
    emoji: '🎉',
    description: 'Finish #1 in a party match',
    target: 1,
    reward: { badge: 'crown' },
  },
  {
    id: 'party_5',
    label: 'Life of the Party',
    emoji: '🪩',
    description: 'Win 5 party matches',
    target: 5,
    reward: { badge: 'party' },
  },
  {
    id: 'matches_10',
    label: 'Warm-Up Complete',
    emoji: '🎮',
    description: 'Play 10 matches',
    target: 10,
    reward: { frame: 'gold' },
  },
  {
    id: 'matches_50',
    label: 'Marathon Mind',
    emoji: '🧠',
    description: 'Play 50 matches',
    target: 50,
    reward: { badge: 'trophy' },
  },
  {
    id: 'science_savvy',
    label: 'Lab Coat',
    emoji: '🔬',
    description: `Earn the Science wedge (${WEDGE_UNLOCK_CORRECT} correct)`,
    target: WEDGE_UNLOCK_CORRECT,
    reward: { badge: 'star' },
  },
  {
    id: 'history_buff',
    label: 'Time Traveler',
    emoji: '📜',
    description: `Earn the History wedge (${WEDGE_UNLOCK_CORRECT} correct)`,
    target: WEDGE_UNLOCK_CORRECT,
    reward: { frame: 'classic' },
  },
  {
    id: 'geo_guru',
    label: 'Globe Trotter',
    emoji: '🌍',
    description: `Earn the Geography wedge (${WEDGE_UNLOCK_CORRECT} correct)`,
    target: WEDGE_UNLOCK_CORRECT,
    reward: { badge: 'fire' },
  },
  {
    id: 'pop_culture_fan',
    label: 'Trend Setter',
    emoji: '📱',
    description: `Earn the Pop Culture wedge (${WEDGE_UNLOCK_CORRECT} correct)`,
    target: WEDGE_UNLOCK_CORRECT,
    reward: { badge: 'bolt' },
  },
  {
    id: 'correct_100',
    label: 'Century Club',
    emoji: '💯',
    description: 'Answer 100 questions correctly (lifetime)',
    target: 100,
    reward: { frame: 'silver' },
  },
  {
    id: 'correct_500',
    label: 'Trivia Titan',
    emoji: '⚡',
    description: 'Answer 500 questions correctly (lifetime)',
    target: 500,
    reward: { frame: 'gold' },
  },
  {
    id: 'elo_1200',
    label: 'Rank Climber',
    emoji: '📈',
    description: 'Reach 1200 ELO',
    target: 1200,
    reward: { badge: 'crown' },
  },
  {
    id: 'pass_play_champ',
    label: 'Couch King',
    emoji: '👑',
    description: 'Win a pass-and-play match',
    target: 1,
    reward: { frame: 'classic' },
  },
  {
    id: 'pass_play_5',
    label: 'Sofa Dynasty',
    emoji: '🛋️',
    description: 'Win 5 pass-and-play matches',
    target: 5,
    reward: { badge: 'party' },
  },
  {
    id: 'quad_winner',
    label: 'Quad Dominator',
    emoji: '4️⃣',
    description: 'Win a 4-player match',
    target: 1,
    reward: { badge: 'gem' },
  },
  {
    id: 'speed_round',
    label: 'Lightning Round',
    emoji: '⚡',
    description: 'Answer 5 questions correctly under 5s each in one match',
    target: 1,
    reward: { badge: 'bolt' },
  },
];

export function defaultAchievementState(): AchievementState {
  return {
    unlocked: [],
    progress: {},
    cosmeticUnlocks: { frames: [], badges: [] },
  };
}

export function defaultProfileStats(): Profile['stats'] {
  return {
    matchesPlayed: 0,
    totalCorrect: 0,
    categoryCorrect: {},
    categoryPlays: {},
    partyWins: 0,
    passPlayWins: 0,
    quadWins: 0,
    seasonXp: 0,
    dailyBests: {},
    bestMatchScore: 0,
    practiceCountToday: 0,
    dailyReminderEnabled: true,
    recentQuestionIds: [],
  };
}

function progressFor(id: AchievementId, profile: Profile, summary?: MatchSummary): number {
  switch (id) {
    case 'first_win':
    case 'wins_5':
    case 'wins_10':
    case 'wins_25':
      return profile.wins;
    case 'streak_3':
    case 'streak_5':
    case 'streak_10':
      return profile.streak;
    case 'daily_7':
      return profile.dailyStreak;
    case 'matches_10':
    case 'matches_50':
      return profile.stats.matchesPlayed;
    case 'wedges_3':
    case 'wedges_6':
    case 'all_wedges':
      return countEarnedWedges(profile);
    case 'daily_30':
      return profile.dailyStreak;
    case 'party_champion':
    case 'party_5':
      return profile.stats.partyWins;
    case 'science_savvy':
      return profile.stats.categoryCorrect.Science ?? 0;
    case 'history_buff':
      return profile.stats.categoryCorrect.History ?? 0;
    case 'geo_guru':
      return profile.stats.categoryCorrect.Geography ?? 0;
    case 'pop_culture_fan':
      return profile.stats.categoryCorrect['Pop Culture'] ?? 0;
    case 'correct_100':
    case 'correct_500':
      return profile.stats.totalCorrect;
    case 'elo_1200':
      return profile.elo;
    case 'pass_play_champ':
    case 'pass_play_5':
      return profile.stats.passPlayWins;
    case 'quad_winner':
      return profile.stats.quadWins ?? 0;
    case 'perfect_game':
      if (!summary) return 0;
      return summary.rounds.length > 0 && summary.rounds.every((r) => r.correct) ? 1 : 0;
    case 'speed_round':
      if (!summary) return 0;
      return summary.rounds.filter((r) => r.correct && r.ms < 5000).length >= 5 ? 1 : 0;
    default:
      return 0;
  }
}

export function getAchievementProgress(
  def: AchievementDef,
  profile: Profile,
  summary?: MatchSummary
): number {
  const stored = profile.achievementState.progress[def.id];
  const computed = progressFor(def.id, profile, summary);
  return Math.max(stored ?? 0, computed);
}

export function isAchievementUnlocked(id: AchievementId, profile: Profile): boolean {
  return profile.achievementState.unlocked.includes(id);
}

function grantReward(state: AchievementState, def: AchievementDef): AchievementState {
  const next = { ...state, cosmeticUnlocks: { ...state.cosmeticUnlocks } };
  if (def.reward?.frame && !next.cosmeticUnlocks.frames.includes(def.reward.frame)) {
    next.cosmeticUnlocks.frames = [...next.cosmeticUnlocks.frames, def.reward.frame];
  }
  if (def.reward?.badge && !next.cosmeticUnlocks.badges.includes(def.reward.badge)) {
    next.cosmeticUnlocks.badges = [...next.cosmeticUnlocks.badges, def.reward.badge];
  }
  return next;
}

export interface AchievementUnlockResult {
  profile: Profile;
  newlyUnlocked: AchievementDef[];
}

export function syncAchievements(
  profile: Profile,
  summary?: MatchSummary
): AchievementUnlockResult {
  const newlyUnlocked: AchievementDef[] = [];
  let achievementState = { ...profile.achievementState };
  const progress = { ...achievementState.progress };

  for (const def of ACHIEVEMENTS) {
    const value = progressFor(def.id, profile, summary);
    progress[def.id] = Math.max(progress[def.id] ?? 0, value);

    if (
      !achievementState.unlocked.includes(def.id) &&
      (progress[def.id] ?? 0) >= def.target
    ) {
      achievementState = {
        ...achievementState,
        unlocked: [...achievementState.unlocked, def.id],
      };
      achievementState = grantReward(achievementState, def);
      newlyUnlocked.push(def);
    }
  }

  return {
    profile: {
      ...profile,
      achievementState: { ...achievementState, progress },
    },
    newlyUnlocked,
  };
}

export function bumpMatchStats(
  profile: Profile,
  summary: MatchSummary,
  correctCategories: Category[]
): { profile: Profile; newWedges: Category[] } {
  const beforeSet = new Set(
    CATEGORY_LIST.filter((c) => (profile.stats.categoryCorrect[c] ?? 0) >= WEDGE_UNLOCK_CORRECT)
  );
  const categoryCorrect = { ...profile.stats.categoryCorrect };
  for (const cat of correctCategories) {
    categoryCorrect[cat] = (categoryCorrect[cat] ?? 0) + 1;
  }

  let partyWins = profile.stats.partyWins;
  let passPlayWins = profile.stats.passPlayWins;
  let quadWins = profile.stats.quadWins ?? 0;
  if (summary.mode === 'party' && summary.partyRank === 1) partyWins += 1;
  if (summary.mode === 'passplay' && summary.partyRank === 1) passPlayWins += 1;
  if (summary.mode === 'quad' && summary.partyRank === 1) quadWins += 1;

  const next: Profile = {
    ...profile,
    stats: {
      ...profile.stats,
      matchesPlayed: profile.stats.matchesPlayed + 1,
      totalCorrect: profile.stats.totalCorrect + correctCategories.length,
      categoryCorrect,
      partyWins,
      passPlayWins,
      quadWins,
      recentQuestionIds: mergeRecentQuestionIds(
        profile.stats.recentQuestionIds,
        summary.rounds.map((r) => r.questionId)
      ),
    },
  };
  const newWedges = CATEGORY_LIST.filter(
    (c) => !beforeSet.has(c) && (categoryCorrect[c] ?? 0) >= WEDGE_UNLOCK_CORRECT
  );
  return { profile: next, newWedges };
}

export function finalizeProfileAfterMatch(
  profile: Profile,
  patch: Partial<Profile>,
  summary: MatchSummary,
  correctCategories: Category[]
): AchievementUnlockResult & { achievementUnlocks: AchievementDef[]; newWedges: Category[] } {
  let next = { ...profile, ...patch };
  const { profile: withStats, newWedges } = bumpMatchStats(next, summary, correctCategories);
  const result = syncAchievements(withStats, summary);
  return { ...result, achievementUnlocks: result.newlyUnlocked, newWedges };
}

export function isCosmeticUnlocked(
  profile: Profile,
  kind: 'frame' | 'badge',
  id: AvatarFrame | AvatarBadge
): boolean {
  if (kind === 'frame') {
    return profile.achievementState.cosmeticUnlocks.frames.includes(id as AvatarFrame);
  }
  return profile.achievementState.cosmeticUnlocks.badges.includes(id as AvatarBadge);
}
