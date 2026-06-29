import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { addCoins, COINS_MATCH_WIN, COINS_PER_CORRECT } from '../lib/coins';
import {
  buyPowerUpWithCoins,
  grantPowerUpPack,
  POWER_UP_COSTS,
} from '../lib/powerUps';
import { claimLoginStreakReward } from '../lib/streakRewards';
import { initAds, showRewardedAd } from '../lib/ads';
import { refreshAudioMode } from '../lib/audio';
import { setSfxEnabled as setGlobalSfxEnabled } from '../lib/gameAudio';
import {
  type AuthUser,
  authUserFromSession,
  fetchRemoteProfile,
  getAuthSession,
  mergeProfileWithAuth,
  signInWithApple as appleSignIn,
  signInWithEmail as emailSignIn,
  signInWithFacebook as facebookSignIn,
  signInWithGoogle as googleSignIn,
  signUpWithEmail as emailSignUp,
  signOut as authSignOut,
  subscribeToAuthChanges,
} from '../lib/auth';
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
  loginRevenueCatUser,
  presentCustomerCenter,
  presentProPaywall,
  purchaseProSubscription,
  removePurchasesListener,
  restoreProSubscription,
  syncProFromStore,
} from '../lib/purchases';
import { loadProfile, saveProfile } from '../lib/storage';
import { pickAndPersistProfileImage, removePersistedImage } from '../lib/profilePhotos';
import { syncProfile } from '../lib/leaderboard';

import type { AvatarConfig, PowerUpType, Profile, VoicePreset } from '../types';

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  authUser: AuthUser | null;
  isSignedIn: boolean;
  authBusy: boolean;
  applyAuthUser: (user: AuthUser) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** @deprecated Use signOut */
  signOutGoogle: () => Promise<void>;
  update: (patch: Partial<Profile>) => Promise<void>;
  setUsername: (name: string) => Promise<void>;
  setAvatar: (avatar: AvatarConfig) => Promise<void>;
  setVoicePreset: (preset: VoicePreset) => Promise<void>;
  setVoiceEnabled: (enabled: boolean) => Promise<void>;
  setSfxEnabled: (enabled: boolean) => Promise<void>;
  setProfilePhoto: () => Promise<void>;
  setCoverPhoto: () => Promise<void>;
  removeProfilePhoto: () => Promise<void>;
  removeCoverPhoto: () => Promise<void>;
  showProPaywall: () => Promise<boolean>;
  purchasePro: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  manageSubscription: () => Promise<void>;
  watchRewardedAd: (placement: RewardedPlacement) => Promise<boolean>;
  claimLoginReward: () => Promise<number>;
  buyPowerUp: (type: PowerUpType) => Promise<boolean>;
  grantMatchCoins: (correctCount: number, won: boolean) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

/** Prevent infinite splash if Supabase/RevenueCat network calls hang. */
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function applyProStatus(prev: Profile, isPro: boolean): Profile {
  return {
    ...prev,
    isPro,
    voicePreset: clampVoicePreset(prev.voicePreset, isPro),
  };
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const profileRef = useRef<Profile | null>(null);
  profileRef.current = profile;
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const applyAuthUser = useCallback(async (user: AuthUser) => {
    setAuthUser(user);
    const remote = await fetchRemoteProfile(user.id);
    const storePro = await syncProFromStore();

    setProfile((prev) => {
      if (!prev) return prev;
      const merged = mergeProfileWithAuth(prev, user, remote);
      const next = applyProStatus(merged, storePro || merged.isPro);
      void saveProfile(next);
      void syncProfile(next);
      void loginRevenueCatUser(user.id);
      return next;
    });
  }, []);

  useEffect(() => {
    setGlobalSfxEnabled(profile?.sfxEnabled ?? false);
    void refreshAudioMode();
  }, [profile?.sfxEnabled]);

  useEffect(() => {
    let mounted = true;

    void initAds();

    const boot = async () => {
      try {
        const p = await loadProfile();
        if (!mounted) return;

        const session = await withTimeout(getAuthSession(), 8000, null);
        let user: AuthUser | null = null;
        let nextProfile = p;

        if (session) {
          user = authUserFromSession(session);
          const remote = await withTimeout(fetchRemoteProfile(user.id), 8000, null);
          nextProfile = mergeProfileWithAuth(p, user, remote);
        }

        await initPurchases(nextProfile.id, (customerInfo) => {
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

        const storePro = await withTimeout(syncProFromStore(), 5000, false);
        nextProfile = applyProStatus(nextProfile, storePro || nextProfile.isPro);

        if (user) {
          setAuthUser(user);
          void loginRevenueCatUser(user.id);
        }

        setProfile(nextProfile);
        void syncProfile(nextProfile);
      } catch (e) {
        console.warn('[profile] boot failed', e);
        const fallback = await loadProfile();
        if (mounted) setProfile(fallback);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void boot();

    const unsubAuth = subscribeToAuthChanges((user) => {
      if (!mounted) return;
      setAuthUser(user);
      if (!user) {
        setProfile((prev) => {
          if (!prev) return prev;
          const next = { ...prev, authProvider: undefined, email: undefined };
          void saveProfile(next);
          return next;
        });
      }
    });

    return () => {
      mounted = false;
      removePurchasesListener();
      unsubAuth?.();
    };
  }, []);

  const completeSignIn = useCallback(
    async (user: AuthUser | null) => {
      if (!user) return;
      await applyAuthUser(user);
      setAuthUser(user);
    },
    [applyAuthUser]
  );

  const runAuth = useCallback(
    async (action: () => Promise<AuthUser | null>, failureTitle: string) => {
      setAuthBusy(true);
      try {
        const user = await action();
        await completeSignIn(user);
      } catch (e) {
        console.warn(`[auth] ${failureTitle}`, e);
        const message = e instanceof Error ? e.message : 'Try again.';
        Alert.alert(failureTitle, message);
      } finally {
        setAuthBusy(false);
      }
    },
    [completeSignIn]
  );

  const signInWithGoogle = useCallback(
    () => runAuth(googleSignIn, 'Sign-in failed'),
    [runAuth]
  );

  const signInWithApple = useCallback(
    () => runAuth(appleSignIn, 'Apple sign-in failed'),
    [runAuth]
  );

  const signInWithFacebook = useCallback(
    () => runAuth(facebookSignIn, 'Facebook sign-in failed'),
    [runAuth]
  );

  const signUpWithEmail = useCallback(
    (email: string, password: string) =>
      runAuth(() => emailSignUp(email, password), 'Sign-up failed'),
    [runAuth]
  );

  const signInWithEmail = useCallback(
    (email: string, password: string) =>
      runAuth(() => emailSignIn(email, password), 'Log-in failed'),
    [runAuth]
  );

  const signOut = useCallback(async () => {
    setAuthBusy(true);
    try {
      await authSignOut();
      setAuthUser(null);
      setProfile((prev) => {
        if (!prev) return prev;
        const next = { ...prev, authProvider: undefined, email: undefined };
        void saveProfile(next);
        return next;
      });
    } catch (e) {
      console.warn('[auth] sign out failed', e);
      Alert.alert('Sign-out failed', 'Could not sign out. Try again.');
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const signOutGoogle = signOut;

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      loading,
      authUser,
      isSignedIn: Boolean(authUser),
      authBusy,
      applyAuthUser,
      signInWithGoogle,
      signInWithApple,
      signInWithFacebook,
      signUpWithEmail,
      signInWithEmail,
      signOut,
      signOutGoogle,
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
      setSfxEnabled: async (enabled) => {
        setGlobalSfxEnabled(enabled);
        void refreshAudioMode();
        setProfile((prev) => {
          if (!prev) return prev;
          const next = { ...prev, sfxEnabled: enabled };
          void saveProfile(next);
          return next;
        });
      },
      setProfilePhoto: async () => {
        const id = profileRef.current?.id;
        if (!id) return;
        const uri = await pickAndPersistProfileImage(id, 'profile');
        if (!uri) return;
        setProfile((prev) => {
          if (!prev) return prev;
          const next = { ...prev, profilePhotoUri: uri };
          void saveProfile(next);
          void syncProfile(next);
          return next;
        });
      },
      setCoverPhoto: async () => {
        const id = profileRef.current?.id;
        if (!id) return;
        const uri = await pickAndPersistProfileImage(id, 'cover');
        if (!uri) return;
        setProfile((prev) => {
          if (!prev) return prev;
          const next = { ...prev, coverPhotoUri: uri };
          void saveProfile(next);
          void syncProfile(next);
          return next;
        });
      },
      removeProfilePhoto: async () => {
        const id = profileRef.current?.id;
        if (!id) return;
        await removePersistedImage(id, 'profile');
        setProfile((prev) => {
          if (!prev) return prev;
          const next = { ...prev, profilePhotoUri: undefined };
          void saveProfile(next);
          void syncProfile(next);
          return next;
        });
      },
      removeCoverPhoto: async () => {
        const id = profileRef.current?.id;
        if (!id) return;
        await removePersistedImage(id, 'cover');
        setProfile((prev) => {
          if (!prev) return prev;
          const next = { ...prev, coverPhotoUri: undefined };
          void saveProfile(next);
          void syncProfile(next);
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
          let next = prev;
          if (placement === 'daily_retry') {
            next = { ...prev, ...applyDailyExtraPlay(prev) };
          } else if (placement === 'streak_shield') {
            next = { ...prev, ...applyStreakShield(prev) };
          } else if (placement === 'power_up_pack') {
            next = grantPowerUpPack(prev);
          }
          void saveProfile(next);
          return next;
        });
        return true;
      },
      claimLoginReward: async () => {
        let granted = 0;
        setProfile((prev) => {
          if (!prev) return prev;
          const { profile: next, coins } = claimLoginStreakReward(prev);
          granted = coins;
          void saveProfile(next);
          return next;
        });
        return granted;
      },
      buyPowerUp: async (type) => {
        let ok = false;
        setProfile((prev) => {
          if (!prev) return prev;
          const next = buyPowerUpWithCoins(prev, type);
          if (!next) return prev;
          ok = true;
          void saveProfile(next);
          return next;
        });
        if (!ok) {
          Alert.alert('Not enough coins', `Need ${POWER_UP_COSTS[type]} coins.`);
        }
        return ok;
      },
      grantMatchCoins: async (correctCount, won) => {
        setProfile((prev) => {
          if (!prev) return prev;
          const amount = correctCount * COINS_PER_CORRECT + (won ? COINS_MATCH_WIN : 0);
          const next = addCoins(prev, amount);
          void saveProfile(next);
          return next;
        });
      },
    }),
    [profile, loading, authUser, authBusy, applyAuthUser, signInWithGoogle, signInWithApple, signInWithFacebook, signUpWithEmail, signInWithEmail, signOut, signOutGoogle]
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
    preset: profile?.voicePreset ?? 'harvey',
    enabled: profile?.voiceEnabled ?? false,
  };
}
