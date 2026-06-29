import AsyncStorage from '@react-native-async-storage/async-storage';

const WALKTHROUGH_KEY = 'bb.walkthrough.v1';

export async function hasCompletedWalkthrough(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(WALKTHROUGH_KEY);
  return raw === 'done';
}

export async function markWalkthroughComplete(): Promise<void> {
  await AsyncStorage.setItem(WALKTHROUGH_KEY, 'done');
}

export async function resetWalkthrough(): Promise<void> {
  await AsyncStorage.removeItem(WALKTHROUGH_KEY);
}

export interface WalkthroughStep {
  id: string;
  emoji: string;
  title: string;
  body: string;
  /** Highlight a home feature for context */
  feature?: 'daily' | 'wedges' | 'quick' | 'account' | 'shop' | 'stats' | 'friends' | 'tournament';
}

export function buildWalkthroughSteps(isSignedIn: boolean): WalkthroughStep[] {
  const steps: WalkthroughStep[] = [
    {
      id: 'welcome',
      emoji: '🎬',
      title: 'Welcome to the studio',
      body: 'Trivia Dash is a fast-paced game show on your phone. Race the clock, collect category wedges, and climb the ranks.',
    },
    {
      id: 'daily',
      emoji: '📅',
      title: 'Daily challenge',
      body: 'Everyone gets the same 10 questions each day. Build a streak, share your grid, and compare scores on the daily board.',
      feature: 'daily',
    },
    {
      id: 'wedges',
      emoji: '🎯',
      title: 'Category wedges',
      body: 'Answer 50 correct in a category to earn its wedge. Fill the wheel to prove you are a true trivia master.',
      feature: 'wedges',
    },
    {
      id: 'quick',
      emoji: '⚡',
      title: 'Quick match',
      body: 'Jump into a solo dash anytime — no waiting for opponents. Ranked mode pits you against real players or smart bots.',
      feature: 'quick',
    },
    {
      id: 'coins',
      emoji: '🪙',
      title: 'Coins & shop',
      body: 'Earn coins with every correct answer. Spend them in the Coin Shop on avatar frames, badges, power-ups, and XP boosts.',
      feature: 'shop',
    },
    {
      id: 'social',
      emoji: '👥',
      title: 'Friends & tournaments',
      body: 'Add friends, challenge them to duels, and compete in bracket tournaments for big coin prizes.',
      feature: 'friends',
    },
  ];

  if (!isSignedIn) {
    steps.push({
      id: 'account',
      emoji: '🔐',
      title: 'Save your progress',
      body: 'Sign up with email or continue with Google, Apple, or Facebook to sync stats, ELO, and achievements across devices.',
      feature: 'account',
    });
  }

  steps.push({
    id: 'ready',
    emoji: '🏁',
    title: 'You are on!',
    body: 'The host is waiting. Tap Quick Match to start your first run — your first 3 matches use easier questions to get you warmed up!',
  });

  return steps;
}
