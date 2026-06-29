/** Global gate for SFX / ambience (separate from host voiceover). */
let sfxEnabled = false;

export function setSfxEnabled(enabled: boolean): void {
  sfxEnabled = enabled;
}

export function isSfxEnabled(): boolean {
  return sfxEnabled;
}
