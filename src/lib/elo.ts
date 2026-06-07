// Standard ELO with a K-factor that decays as players climb, so early games move
// fast (good for retention) and high-rank games feel earned.
export function kFactor(elo: number): number {
  if (elo < 1200) return 48;
  if (elo < 1800) return 32;
  return 20;
}

export function expectedScore(a: number, b: number): number {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

// score: 1 win, 0.5 draw, 0 loss
export function nextElo(elo: number, opponentElo: number, score: number): number {
  const k = kFactor(elo);
  const expected = expectedScore(elo, opponentElo);
  return Math.round(elo + k * (score - expected));
}

export function rankTitle(elo: number): { title: string; color: string } {
  if (elo >= 2200) return { title: 'Grandmaster', color: '#FF5C8A' };
  if (elo >= 1900) return { title: 'Master', color: '#FFD24D' };
  if (elo >= 1600) return { title: 'Diamond', color: '#7CE7FF' };
  if (elo >= 1400) return { title: 'Platinum', color: '#3DDC97' };
  if (elo >= 1200) return { title: 'Gold', color: '#FFC44D' };
  if (elo >= 1000) return { title: 'Silver', color: '#CBD3DE' };
  return { title: 'Bronze', color: '#E0925C' };
}
