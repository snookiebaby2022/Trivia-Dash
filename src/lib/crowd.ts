export interface CrowdState {
  intensity: number;
  mood: 'silent' | 'murmur' | 'buzzing' | 'cheering' | 'roaring' | 'electric';
  pulseActive: boolean;
}

let state: CrowdState = {
  intensity: 0,
  mood: 'silent',
  pulseActive: false,
};

function intensityToMood(i: number): CrowdState['mood'] {
  if (i >= 85) return 'electric';
  if (i >= 65) return 'roaring';
  if (i >= 45) return 'cheering';
  if (i >= 25) return 'buzzing';
  if (i >= 10) return 'murmur';
  return 'silent';
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

function update(): void {
  state.mood = intensityToMood(state.intensity);
}

export function getCrowdState(): CrowdState {
  return { ...state };
}

export function onCorrectAnswer(streak: number): void {
  const base = 8;
  const multiplier = streak >= 7 ? 4 : streak >= 5 ? 3 : streak >= 3 ? 2 : 1;
  state.intensity = clamp(state.intensity + base * multiplier);
  state.pulseActive = streak >= 3;
  update();
}

export function onWrongAnswer(): void {
  state.intensity = clamp(state.intensity * 0.5);
  state.pulseActive = false;
  update();
}

export function onCloseCall(msLeft: number): void {
  if (msLeft < 2000) {
    state.intensity = clamp(state.intensity + 5);
    update();
  }
}

export function onGameStart(): void {
  state.intensity = clamp(state.intensity + 10);
  state.pulseActive = false;
  update();
}

export function onGameOver(isWin: boolean): void {
  if (isWin) {
    state.intensity = clamp(state.intensity + 25);
  } else {
    state.intensity = clamp(state.intensity * 0.3);
  }
  state.pulseActive = false;
  update();
}

export function onNewRecord(): void {
  state.intensity = 100;
  state.pulseActive = true;
  update();
}

export function resetCrowd(): void {
  state = { intensity: 0, mood: 'silent', pulseActive: false };
}
