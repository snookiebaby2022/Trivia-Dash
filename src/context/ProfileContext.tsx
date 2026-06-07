import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { initAds, showRewardedAd } from '../lib/ads';
import {
  applyDailyExtraPlay,
  applyStreakShield,
  clampVoicePreset,
  type RewardedPlacement,
  saveProStatus,
} from '../lib/monetization';
import {
  initPurchases,
  isProEntitled,
  presentCustomerCenter,
  presentProPaywall,
  purchaseProSubscription,
  removePurchasesListener,
  restoreProSubscription,
  syncProFromStore,
} from '../lib/purchases';
import { loadProfile, saveProfile } from '../lib/storage';
import { syncProfile } from '../lib/leaderboard';
import type { AvatarConfig, Profile, VoicePreset } from '../types';

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  update: (patch: Partial<Profile>) => Promise<void>;
  setUsername: (name: string) => Promise<void>;
  setAvatar: (avatar: AvatarConfig) => Promise<void>;
  setVoicePreset: (preset: VoicePreset) => Promise<void>;
  setVoiceEnabled: (enabled: boolean) => Promise<void>;
  /** Opens RevenueCat Paywall (preferred). Falls back to direct purchase in dev. */
  showProPaywall: () => Promise<boolean>;
  /** Legacy direct purchase — monthly package. */
  purchasePro: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  /** RevenueCat Customer Center — manage/cancel subscription. */
  manageSubscription: () => Promise<void>;
  watchRewardedAd: (placement: RewardedPlacement) => Promise<boolean>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

function applyProStatus(prev: Profile, isPro: boolean): Profile {
  return {
    ...prev,
    isPro,
    voicePreset: clampVoicePreset(prev.voicePreset, isPro),
  };
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    void initAds();
    loadProfile().then(async (p) => {
      if (!mounted) return;

      await initPurchases(p.id, (customerInfo) => {
        if (!mounted) return;
        const active = isProEntitled(customerInfo);
        void saveProStatus(active);
        setProfile((prev) => {
          if (!prev) return prev;
          if (prev.isPro === active) return prev;
          const next = applyProStatus(prev, active);
          void saveProfile(next);
          void syncProfile(next);
          return next;
        });
      });

      const storePro = await syncProFromStore();
      const next = storePro ? applyProStatus(p, true) : applyProStatus(p, p.isPro);
      setProfile(next);
      setLoading(false);
      void syncProfile(next);
    });

    return () => {
      mounted = false;
      removePurchasesListener();
    };
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      loading,
      update: async (patch) => {
        setProfile((prev) => {
          if (!prev) return prev;
          const next = { ...prev, ...patch };
          void saveProfile(next);
          void syncProfile(next);
          return next;
        });
      },
      setUsername: async (name) => {
        const clean = name.trim().slice(0, 16) || 'Player';
        setProfile((prev) => {
          if (!prev) return prev;
          const next = { ...prev, username: clean };
          void saveProfile(next);
          void syncProfile(next);
          return next;
        });
      },
      setAvatar: async (avatar) => {
        setProfile((prev) => {
          if (!prev) return prev;
          const next = { ...prev, avatar };
          void saveProfile(next);
          void syncProfile(next);
          return next;
        });
      },
      setVoicePreset: async (preset) => {
        setProfile((prev) => {
          if (!prev) return prev;
          const safe = clampVoicePreset(preset, prev.isPro);
          const next = { ...prev, voicePreset: safe };
          void saveProfile(next);
          return next;
        });
      },
      setVoiceEnabled: async (enabled) => {
        setProfile((prev) => {
          if (!prev) return prev;
          const next = { ...prev, voiceEnabled: enabled };
          void saveProfile(next);
          return next;
        });
      },
      showProPaywall: async () => {
        const ok = await presentProPaywall();
        if (!ok) return false;
        setProfile((prev) => {
          if (!prev) return prev;
          const next = applyProStatus(prev, true);
          void saveProfile(next);
          void syncProfile(next);
          return next;
        });
        return true;
      },
      purchasePro: async () => {
        const ok = await purchaseProSubscription();
        if (!ok) return false;
        setProfile((prev) => {
          if (!prev) return prev;
          const next = applyProStatus(prev, true);
          void saveProfile(next);
          void syncProfile(next);
          return next;
        });
        return true;
      },
      restorePurchases: async () => {
        const ok = await restoreProSubscription();
        if (!ok) return false;
        setProfile((prev) => {
          if (!prev) return prev;
          const next = applyProStatus(prev, true);
          void saveProfile(next);
          void syncProfile(next);
          return next;
        });
        return true;
      },
      manageSubscription: async () => {
        await presentCustomerCenter();
        const active = await syncProFromStore();
        setProfile((prev) => {
          if (!prev) return prev;
          if (prev.isPro === active) return prev;
          const next = applyProStatus(prev, active);
          void saveProfile(next);
          void syncProfile(next);
          return next;
        });
      },
      watchRewardedAd: async (placement) => {
        const ok = await showRewardedAd(placement);
        if (!ok) return false;
        setProfile((prev) => {
          if (!prev) return prev;
          const patch =
            placement === 'daily_retry'
              ? applyDailyExtraPlay(prev)
              : applyStreakShield(prev);
          const next = { ...prev, ...patch };
          void saveProfile(next);
          return next;
        });
        return true;
      },
    }),
    [profile, loading]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}

export function useIsPro(): boolean {
  const { profile } = useProfile();
  return profile?.isPro ?? false;
}

export function useVoiceSettings() {
  const { profile } = useProfile();
  return {
    preset: profile?.voicePreset ?? 'host',
    enabled: profile?.voiceEnabled ?? true,
  };
}
