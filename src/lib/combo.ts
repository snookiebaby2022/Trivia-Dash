/** Combo multiplier from consecutive correct answers in a match. */
export function comboMultiplier(streak: number): number {
  if (streak < 2) return 1;
  if (streak < 4) return 2;
  if (streak < 6) return 3;
  if (streak < 8) return 4;
  return 5;
}

export function comboLabel(streak: number): string | null {
  const m = comboMultiplier(streak);
  if (m <= 1) return null;
  return `×${m} COMBO`;
}
