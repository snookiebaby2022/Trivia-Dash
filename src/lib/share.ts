import { Share } from 'react-native';

import { APP_NAME } from './brand';
import type { MatchSummary } from '../types';

export async function shareMatchResult(summary: MatchSummary): Promise<void> {
  const outcome =
    summary.outcome === 'win' ? 'WON' : summary.outcome === 'draw' ? 'DRAW' : 'LOST';
  const modeLabel =
    summary.mode === 'daily'
      ? 'Daily'
      : summary.mode === 'quad'
        ? '4-Player'
        : summary.mode === 'party'
        ? 'Party'
        : summary.mode === 'quick'
          ? 'Ranked'
          : 'Solo';

  const grid =
    summary.shareGrid ??
    summary.rounds
      .map((r) => (r.correct ? (r.points >= 170 ? '🟩' : r.points >= 100 ? '🟨' : '🟧') : '⬛'))
      .join('');

  const partyLine =
    summary.partyRank && summary.partySize
      ? `\nParty rank: #${summary.partyRank} of ${summary.partySize} 🎉`
      : '';

  const message =
    `${APP_NAME} ${modeLabel} ${outcome}! ⚔\n` +
    `${grid}\n` +
    `Me ${summary.you} — ${summary.opponentName} ${summary.opponent}\n` +
    `ELO ${summary.eloDelta >= 0 ? '+' : ''}${summary.eloDelta} → ${summary.newElo}` +
    partyLine +
    `\nJoin the party 🧠`;

  await Share.share({ message, title: `${APP_NAME} Result` });
}
