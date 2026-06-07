import { Alert, Platform } from 'react-native';

import {
  ADMOB_INTERSTITIAL_ID,
  ADMOB_REWARDED_ID,
  type RewardedPlacement,
} from './monetization';

type AdModule = typeof import('react-native-google-mobile-ads');

let adsModule: AdModule | null = null;
let initialized = false;
let interstitialLoaded = false;
let rewardedLoaded = false;

function getAdsModule(): AdModule | null {
  if (adsModule !== null) return adsModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    adsModule = require('react-native-google-mobile-ads') as AdModule;
    return adsModule;
  } catch {
    return null;
  }
}

function mockRewardedConfirm(placement: RewardedPlacement): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Rewarded ad (dev)',
      placement === 'daily_retry'
        ? 'Watch a short ad to unlock a bonus daily run?'
        : 'Watch a short ad to shield your daily streak?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Watch & earn', onPress: () => resolve(true) },
      ]
    );
  });
}

export async function initAds(): Promise<void> {
  if (initialized) return;
  const mod = getAdsModule();
  if (!mod) {
    initialized = true;
    return;
  }
  try {
    await mod.default().initialize();
    await preloadInterstitial();
    await preloadRewarded();
  } catch {
    // Native ads unavailable (Expo Go / missing config)
  }
  initialized = true;
}

export async function preloadInterstitial(): Promise<void> {
  const mod = getAdsModule();
  if (!mod) return;
  try {
    const ad = mod.InterstitialAd.createForAdRequest(ADMOB_INTERSTITIAL_ID);
    await new Promise<void>((resolve) => {
      const unsub = ad.addAdEventListener(mod.AdEventType.LOADED, () => {
        interstitialLoaded = true;
        unsub();
        resolve();
      });
      ad.addAdEventListener(mod.AdEventType.ERROR, () => {
        unsub();
        resolve();
      });
      ad.load();
    });
  } catch {
    interstitialLoaded = false;
  }
}

export async function showInterstitialAd(): Promise<boolean> {
  const mod = getAdsModule();
  if (!mod) {
    if (__DEV__) {
      return new Promise((resolve) => {
        Alert.alert('Interstitial ad (dev)', 'Ad would show here in a production build.', [
          { text: 'OK', onPress: () => resolve(true) },
        ]);
      });
    }
    return false;
  }
  if (!interstitialLoaded) {
    await preloadInterstitial();
  }
  try {
    const ad = mod.InterstitialAd.createForAdRequest(ADMOB_INTERSTITIAL_ID);
    return await new Promise<boolean>((resolve) => {
      let shown = false;
      const cleanup: (() => void)[] = [];
      const done = (ok: boolean) => {
        cleanup.forEach((fn) => fn());
        interstitialLoaded = false;
        void preloadInterstitial();
        resolve(ok);
      };
      cleanup.push(
        ad.addAdEventListener(mod.AdEventType.LOADED, () => {
          if (!shown) {
            shown = true;
            ad.show();
          }
        })
      );
      cleanup.push(
        ad.addAdEventListener(mod.AdEventType.CLOSED, () => done(true))
      );
      cleanup.push(
        ad.addAdEventListener(mod.AdEventType.ERROR, () => done(false))
      );
      ad.load();
      setTimeout(() => {
        if (!shown) done(false);
      }, 8000);
    });
  } catch {
    return false;
  }
}

async function preloadRewarded(): Promise<void> {
  const mod = getAdsModule();
  if (!mod) return;
  try {
    const ad = mod.RewardedAd.createForAdRequest(ADMOB_REWARDED_ID);
    await new Promise<void>((resolve) => {
      const unsub = ad.addAdEventListener(mod.RewardedAdEventType.LOADED, () => {
        rewardedLoaded = true;
        unsub();
        resolve();
      });
      ad.addAdEventListener(mod.AdEventType.ERROR, () => {
        unsub();
        resolve();
      });
      ad.load();
    });
  } catch {
    rewardedLoaded = false;
  }
}

export async function showRewardedAd(placement: RewardedPlacement): Promise<boolean> {
  const mod = getAdsModule();
  if (!mod) {
    return mockRewardedConfirm(placement);
  }
  if (!rewardedLoaded) {
    await preloadRewarded();
  }
  try {
    const ad = mod.RewardedAd.createForAdRequest(ADMOB_REWARDED_ID);
    return await new Promise<boolean>((resolve) => {
      let rewarded = false;
      const cleanup: (() => void)[] = [];
      const finish = (ok: boolean) => {
        cleanup.forEach((fn) => fn());
        rewardedLoaded = false;
        void preloadRewarded();
        resolve(ok);
      };
      cleanup.push(
        ad.addAdEventListener(mod.RewardedAdEventType.LOADED, () => ad.show())
      );
      cleanup.push(
        ad.addAdEventListener(mod.RewardedAdEventType.EARNED_REWARD, () => {
          rewarded = true;
        })
      );
      cleanup.push(
        ad.addAdEventListener(mod.AdEventType.CLOSED, () => finish(rewarded))
      );
      cleanup.push(
        ad.addAdEventListener(mod.AdEventType.ERROR, () => finish(false))
      );
      ad.load();
      setTimeout(() => finish(false), 12000);
    });
  } catch {
    return mockRewardedConfirm(placement);
  }
}

export function adsNativeAvailable(): boolean {
  return getAdsModule() !== null && Platform.OS !== 'web';
}
