import type { MatchSummary } from '../types';
import { darkColors, type ThemeColors } from '../theme';

export interface ResultPresentation {
  headline: string;
  subline: string;
  voiceLine: string;
  headlineColor: string;
}

function correctCount(summary: MatchSummary): number {
  return summary.rounds.filter((r) => r.correct).length;
}

/** Family Feud / Steve Harvey–style result screen copy + voice line. */
export function getResultPresentation(
  summary: MatchSummary,
  palette: ThemeColors = darkColors
): ResultPresentation {
  const correct = correctCount(summary);
  const total = summary.rounds.length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const solo = summary.mode === 'solo' || summary.mode === 'practice';

  if (solo) {
    if (pct >= 85) {
      return {
        headline: 'SURVEY SAYS…',
        subline: `${correct}/${total} correct — number one answer!`,
        voiceLine: `Survey says! ${correct} out of ${total}. That is a championship run right there!`,
        headlineColor: palette.success,
      };
    }
    if (pct >= 50) {
      return {
        headline: 'GOOD BOARD!',
        subline: `${correct}/${total} correct — solid round`,
        voiceLine: `Not bad, not bad! ${correct} correct. The crowd is with you!`,
        headlineColor: palette.primary,
      };
    }
    return {
      headline: 'STRIKE OUT',
      subline: `${correct}/${total} correct — run it back`,
      voiceLine: `Ooh! Only ${correct} on the board. Shake it off and come back stronger!`,
      headlineColor: palette.warning,
    };
  }

  if (summary.outcome === 'win') {
    return {
      headline: 'SURVEY SAYS…',
      subline: `You beat ${summary.opponentName}!`,
      voiceLine: `Survey says… VICTORY! ${correct} out of ${total} correct. ${summary.opponentName} is going home!`,
      headlineColor: palette.success,
    };
  }

  if (summary.outcome === 'draw') {
    return {
      headline: 'SPLIT DECISION',
      subline: `Tied with ${summary.opponentName}`,
      voiceLine: `We got a tie! Nobody walks away mad — ${correct} correct apiece.`,
      headlineColor: palette.warning,
    };
  }

  return {
    headline: 'NOT ON THE BOARD',
    subline: `${summary.opponentName} got you this time`,
    voiceLine: `I'm sorry… that's not on the board. ${summary.opponentName} takes it. You still my player though!`,
    headlineColor: palette.danger,
  };
}
