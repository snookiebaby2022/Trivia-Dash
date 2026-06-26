import { Share } from 'react-native';

import { runShareJob } from '../context/ShareCardProvider';
import { APP_NAME } from './brand';
import type { Category } from '../types';

export async function shareWedgeUnlock(category: Category, username: string): Promise<void> {
  const message =
    `🥧 I earned the ${category} wedge in ${APP_NAME}!\n` +
    `50 correct answers in ${category} — wedge unlocked.\n` +
    `— ${username}\n` +
    `Can you fill the pie? 🧠`;
  await runShareJob({ kind: 'wedge', category, username, message });
}

export async function shareDailyResult(
  dateKey: string,
  score: number,
  rank: number,
  username: string
): Promise<void> {
  const message =
    `📅 ${APP_NAME} Daily ${dateKey}\n` +
    `Score: ${score} · Rank #${rank}\n` +
    `— ${username}\n` +
    `Same 10 questions for everyone today — beat me!`;
  await runShareJob({ kind: 'daily', dateKey, score, rank, username, message });
}

export async function shareFriendCode(code: string, hostName: string): Promise<void> {
  const message =
    `🎉 Join my ${APP_NAME} party!\n` +
    `Code: ${code}\n` +
    `Host: ${hostName}\n` +
    `Open the app → Friend party → Join`;
  await Share.share({ message, title: 'Party invite' });
}
