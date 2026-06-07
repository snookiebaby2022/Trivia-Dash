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
  | 'streak_3'
  | 'streak_5'
  | 'perfect_game'
  | 'all_wedges'
  | 'daily_7'
  | 'party_champion'
  | 'matches_10'
  | 'science_savvy'
  | 'pass_play_champ';

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
    id: 'all_wedges',
    label: 'Rainbow Brain',
    emoji: '🌈',
    description: 'Collect all 7 category wedges in one match',
    target: 1,
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
    id: 'party_champion',
    label: 'Party Legend',
    emoji: '🎉',
    description: 'Finish #1 in a party match',
    target: 1,
    reward: { badge: 'crown' },
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
    id: 'science_savvy',
    label: 'Lab Coat',
    emoji: '🔬',
    description: 'Answer 10 Science questions correctly (lifetime)',
    target: 10,
    reward: { badge: 'star' },
  },
  {
    id: 'pass_play_champ',
    label: 'Couch King',
    emoji: '👑',
    description: 'Win a pass-and-play match',
    target: 1,
    reward: { frame: 'classic' },
  },
];

const ALL_CATEGORIES: Category[] = [
  'General',
  'Science',
  'History',
  'Geography',
  'Sports',
  'Entertainment',
  'Pop Culture',
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
    partyWins: 0,
    passPlayWins: 0,
  };
}

function progressFor(id: AchievementId, profile: Profile, summary?: MatchSummary): number {
  switch (id) {
    case 'first_win':
    case 'wins_5':
    case 'wins_10':
      return profile.wins;
    case 'streak_3':
    case 'streak_5':
      return profile.streak;
    case 'daily_7':
      return profile.dailyStreak;
    case 'matches_10':
      return profile.stats.matchesPlayed;
    case 'science_savvy':
      return profile.stats.categoryCorrect.Science ?? 0;
    case 'party_champion':
      return profile.stats.partyWins;
    case 'pass_play_champ':
      return profile.stats.passPlayWins;
    case 'perfect_game':
      if (!summary || summary.outcome !== 'win') return 0;
      return summary.rounds.length > 0 && summary.rounds.every((r) => r.correct) ? 1 : 0;
    case 'all_wedges':
      if (!summary || summary.outcome !== 'win') return 0;
      return (summary.collectedWedges?.length ?? 0) >= ALL_CATEGORIES.length ? 1 : 0;
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
): Profile {
  const categoryCorrect = { ...profile.stats.categoryCorrect };
  for (const cat of correctCategories) {
    categoryCorrect[cat] = (categoryCorrect[cat] ?? 0) + 1;
  }

  let partyWins = profile.stats.partyWins;
  let passPlayWins = profile.stats.passPlayWins;
  if (summary.mode === 'party' && summary.partyRank === 1) partyWins += 1;
  if (summary.mode === 'passplay' && summary.partyRank === 1) passPlayWins += 1;

  return {
    ...profile,
    stats: {
      ...profile.stats,
      matchesPlayed: profile.stats.matchesPlayed + 1,
      totalCorrect: profile.stats.totalCorrect + correctCategories.length,
      categoryCorrect,
      partyWins,
      passPlayWins,
    },
  };
}

export function bumpCategoryCorrect(
  profile: Profile,
  categories: Category[]
): Profile {
  const categoryCorrect = { ...profile.stats.categoryCorrect };
  for (const cat of categories) {
    categoryCorrect[cat] = (categoryCorrect[cat] ?? 0) + 1;
  }
  return {
    ...profile,
    stats: {
      ...profile.stats,
      totalCorrect: profile.stats.totalCorrect + categories.length,
      categoryCorrect,
    },
  };
}

export function finalizeProfileAfterMatch(
  profile: Profile,
  patch: Partial<Profile>,
  summary: MatchSummary,
  correctCategories: Category[]
): AchievementUnlockResult & { achievementUnlocks: AchievementDef[] } {
  let next = { ...profile, ...patch };
  next = bumpMatchStats(next, summary, correctCategories);
  const result = syncAchievements(next, summary);
  return { ...result, achievementUnlocks: result.newlyUnlocked };
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
