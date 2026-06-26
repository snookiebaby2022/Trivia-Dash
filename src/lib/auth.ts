import type { Session, User } from '@supabase/supabase-js';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Alert } from 'react-native';

import { isSupabaseConfigured, supabase } from './supabase';
import type { AuthProvider, Profile } from '../types';

WebBrowser.maybeCompleteAuthSession();

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  provider?: AuthProvider;
}

export type OAuthProvider = 'google' | 'apple' | 'facebook';

const redirectTo = makeRedirectUri({
  scheme: 'triviadash',
  path: 'auth/callback',
});

function displayNameFromUser(user: User): string {
  const meta = user.user_metadata ?? {};
  const name =
    (meta.full_name as string) ||
    (meta.name as string) ||
    user.email?.split('@')[0] ||
    'Player';
  return name.trim().slice(0, 16) || 'Player';
}

function authProviderFromUser(user: User): AuthProvider {
  const provider = user.app_metadata?.provider as string | undefined;
  if (provider === 'google') return 'google';
  if (provider === 'apple') return 'apple';
  if (provider === 'facebook') return 'facebook';
  return 'email';
}

export function authUserFromSession(session: Session): AuthUser {
  const user = session.user;
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: displayNameFromUser(user),
    avatarUrl: (meta.avatar_url as string) || (meta.picture as string) || undefined,
    provider: authProviderFromUser(user),
  };
}

async function createSessionFromUrl(url: string): Promise<Session | null> {
  if (!supabase) return null;

  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) {
    throw new Error(errorCode);
  }

  const { access_token, refresh_token } = params;
  if (!access_token) return null;

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
  return data.session;
}

function requireSupabase(): boolean {
  if (!isSupabaseConfigured || !supabase) {
    Alert.alert(
      'Sign-in unavailable',
      'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env, then enable providers in your Supabase dashboard.'
    );
    return false;
  }
  return true;
}

export async function getAuthSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

async function signInWithOAuthProvider(provider: OAuthProvider): Promise<AuthUser | null> {
  if (!requireSupabase() || !supabase) return null;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('No OAuth URL returned');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return null;

  const session = await createSessionFromUrl(result.url);
  if (!session) return null;
  return authUserFromSession(session);
}

export async function signInWithGoogle(): Promise<AuthUser | null> {
  return signInWithOAuthProvider('google');
}

export async function signInWithApple(): Promise<AuthUser | null> {
  return signInWithOAuthProvider('apple');
}

export async function signInWithFacebook(): Promise<AuthUser | null> {
  return signInWithOAuthProvider('facebook');
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthUser | null> {
  if (!requireSupabase() || !supabase) return null;

  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes('@')) {
    throw new Error('Enter a valid email address.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const { data, error } = await supabase.auth.signUp({
    email: trimmed,
    password,
  });
  if (error) throw error;

  if (data.session) {
    return authUserFromSession(data.session);
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: trimmed,
    password,
  });
  if (signInError) throw signInError;
  if (!signInData.session) return null;
  return authUserFromSession(signInData.session);
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser | null> {
  if (!requireSupabase() || !supabase) return null;

  const trimmed = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmed,
    password,
  });
  if (error) throw error;
  if (!data.session) return null;
  return authUserFromSession(data.session);
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function handleAuthRedirectUrl(url: string): Promise<AuthUser | null> {
  const session = await createSessionFromUrl(url);
  if (!session) return null;
  return authUserFromSession(session);
}

export async function fetchRemoteProfile(userId: string): Promise<Partial<Profile> | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    username: data.username as string,
    elo: data.elo as number,
    wins: data.wins as number,
    losses: data.losses as number,
    draws: data.draws as number,
    bestStreak: data.best_streak as number,
    streak: data.streak as number,
    isPro: data.is_pro as boolean,
    dailyStreak: data.daily_streak as number,
    lastDailyDate: (data.last_daily_date as string) ?? undefined,
  };
}

/** Merge cloud account with local guest profile (cloud wins on conflicts). */
export function mergeProfileWithAuth(local: Profile, auth: AuthUser, remote?: Partial<Profile> | null): Profile {
  const base: Profile = {
    ...local,
    id: auth.id,
    username: remote?.username ?? auth.displayName,
    email: auth.email,
    authProvider: auth.provider ?? 'email',
    profilePhotoUri: auth.avatarUrl ?? local.profilePhotoUri,
  };

  if (!remote) return base;

  return {
    ...base,
    elo: Math.max(base.elo, remote.elo ?? 0),
    wins: Math.max(base.wins, remote.wins ?? 0),
    losses: Math.max(base.losses, remote.losses ?? 0),
    draws: Math.max(base.draws, remote.draws ?? 0),
    bestStreak: Math.max(base.bestStreak, remote.bestStreak ?? 0),
    streak: Math.max(base.streak, remote.streak ?? 0),
    dailyStreak: Math.max(base.dailyStreak, remote.dailyStreak ?? 0),
    isPro: base.isPro || Boolean(remote.isPro),
    lastDailyDate: remote.lastDailyDate ?? base.lastDailyDate,
  };
}

export function subscribeToAuthChanges(
  onChange: (user: AuthUser | null) => void
): (() => void) | null {
  if (!supabase) return null;

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onChange(session ? authUserFromSession(session) : null);
  });

  return () => data.subscription.unsubscribe();
}
