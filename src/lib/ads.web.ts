import type { RewardedPlacement } from './monetization';

/** Web build — AdMob is native-only; no-op stubs. */
export async function initAds(): Promise<void> {}

export async function showInterstitialAd(): Promise<boolean> {
  return false;
}

export async function showRewardedAd(_placement: RewardedPlacement): Promise<boolean> {
  return false;
}

export function adsNativeAvailable(): boolean {
  return false;
}
