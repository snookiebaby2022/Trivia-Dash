import { todayKey } from './daily';
import { addCoins } from './coins';
import type { Profile } from '../types';

/** Coins per login-streak day (cycles 1–7). */
export const LOGIN_STREAK_REWARDS = [50, 75, 100, 125, 150, 175, 200] as const;

export interface LoginStreakState {
  streak: number;
  dayIndex: number;
  rewardCoins: number;
  canClaim: boolean;
  alreadyClaimedToday: boolean;
}

function daysBetween(a: string, b: string): number {
  const d0 = new Date(a).getTime();
  const d1 = new Date(b).getTime();
  return Math.round((d1 - d0) / 86400000);
}

export function getLoginStreakState(profile: Profile, dateKey = todayKey()): LoginStreakState {
  const last = profile.lastLoginDate;
  const claimed = profile.lastLoginRewardDate === dateKey;
  let streak = profile.loginStreak ?? 0;

  if (!last) {
    streak = 1;
  } else if (last === dateKey) {
    // same day — keep streak
  } else if (daysBetween(last, dateKey) === 1) {
    streak = Math.min(7, streak + 1);
  } else if (daysBetween(last, dateKey) > 1) {
    streak = 1;
  }

  const dayIndex = Math.max(0, Math.min(6, streak - 1));
  const rewardCoins = LOGIN_STREAK_REWARDS[dayIndex];

  return {
    streak,
    dayIndex,
    rewardCoins,
    canClaim: !claimed,
    alreadyClaimedToday: claimed,
  };
}

export function claimLoginStreakReward(profile: Profile, dateKey = todayKey()): {
  profile: Profile;
  coins: number;
} {
  const state = getLoginStreakState(profile, dateKey);
  if (!state.canClaim) {
    return { profile, coins: 0 };
  }

  const next = addCoins(
    {
      ...profile,
      loginStreak: state.streak,
      lastLoginDate: dateKey,
      lastLoginRewardDate: dateKey,
    },
    state.rewardCoins
  );

  if (state.dayIndex === 6) {
    const inv = next.powerUps ?? { fiftyFifty: 0, extraTime: 0, skip: 0 };
    next.powerUps = { ...inv, fiftyFifty: inv.fiftyFifty + 1 };
  }

  return { profile: next, coins: state.rewardCoins };
}

export function loginStreakCalendar(state: LoginStreakState): { day: number; coins: number; status: 'claimed' | 'today' | 'future' }[] {
  return LOGIN_STREAK_REWARDS.map((coins, i) => {
    let status: 'claimed' | 'today' | 'future' = 'future';
    if (i < state.dayIndex) status = 'claimed';
    else if (i === state.dayIndex && state.canClaim) status = 'today';
    else if (i === state.dayIndex && state.alreadyClaimedToday) status = 'claimed';
    return { day: i + 1, coins, status };
  });
}
