import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { isSupabaseConfigured } from '../lib/supabase';
import type { AuthProvider } from '../types';
import { font, radius, spacing } from '../theme';

const PROVIDER_LABELS: Record<AuthProvider, string> = {
  google: 'Google',
  apple: 'Apple',
  facebook: 'Facebook',
  email: 'Email',
};

export function AuthPanel({ compact }: { compact?: boolean }) {
  const { colors } = useTheme();
  const {
    authUser,
    isSignedIn,
    authBusy,
    signInWithGoogle,
    signInWithApple,
    signInWithFacebook,
    signUpWithEmail,
    signInWithEmail,
    signOut,
  } = useProfile();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const styles = makeStyles(colors);

  if (dismissed) return null;

  if (!isSupabaseConfigured) {
    return (
      <View style={styles.hintCard}>
        <Text style={styles.hintText}>Sign-in needs Supabase keys in .env</Text>
      </View>
    );
  }

  if (isSignedIn && authUser) {
    const label = authUser.provider ? PROVIDER_LABELS[authUser.provider] : 'Account';
    return (
      <View style={styles.signedInCard}>
        <View style={styles.signedInRow}>
          <Text style={styles.providerIcon}>
            {authUser.provider === 'google'
              ? 'G'
              : authUser.provider === 'apple'
                ? ''
                : authUser.provider === 'facebook'
                  ? 'f'
                  : '✉'}
          </Text>
          <View style={styles.signedInBody}>
            <Text style={styles.signedInLabel}>Signed in with {label}</Text>
            <Text style={styles.signedInEmail} numberOfLines={1}>
              {authUser.email}
            </Text>
          </View>
        </View>
        <Pressable style={styles.signOutBtn} onPress={() => void signOut()} disabled={authBusy}>
          <Text style={styles.signOutText}>{authBusy ? 'Signing out…' : 'Sign out'}</Text>
        </Pressable>
      </View>
    );
  }

  const handleEmail = async () => {
    if (mode === 'signup') {
      await signUpWithEmail(email, password);
    } else {
      await signInWithEmail(email, password);
    }
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {!compact && <Text style={styles.sectionTitle}>Save your progress</Text>}

      {showEmailForm ? (
        <View style={styles.emailCard}>
          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeTab, mode === 'signin' && styles.modeTabActive]}
              onPress={() => setMode('signin')}
            >
              <Text style={[styles.modeTabText, mode === 'signin' && styles.modeTabTextActive]}>
                Log in
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
                Sign up
              </Text>
            </Pressable>
          </View>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password (6+ characters)"
            placeholderTextColor={colors.textFaint}
            secureTextEntry
            autoComplete={mode === 'signup' ? 'new-password' : 'password'}
            style={styles.input}
          />

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            onPress={() => void handleEmail()}
            disabled={authBusy}
          >
            {authBusy ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === 'signup' ? 'Create account' : 'Log in with email'}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={() => setShowEmailForm(false)}>
            <Text style={styles.backLink}>← Social sign-in</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <SocialButton
            colors={colors}
            icon="G"
            iconColor="#4285F4"
            label="Continue with Google"
            onPress={() => void signInWithGoogle()}
            busy={authBusy}
          />
          {Platform.OS === 'ios' && (
            <SocialButton
              colors={colors}
              icon=""
              iconColor={colors.text}
              label="Continue with Apple"
              onPress={() => void signInWithApple()}
              busy={authBusy}
            />
          )}
          <SocialButton
            colors={colors}
            icon="f"
            iconColor="#1877F2"
            label="Continue with Facebook"
            onPress={() => void signInWithFacebook()}
            busy={authBusy}
          />
          <Pressable
            style={({ pressed }) => [styles.emailToggle, pressed && styles.btnPressed]}
            onPress={() => setShowEmailForm(true)}
          >
            <Text style={styles.emailToggleText}>✉  Sign up / log in with email</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.guestBtn, pressed && { opacity: 0.7 }]} onPress={() => setDismissed(true)}>
            <Text style={styles.guestBtnText}>Continue as Guest →</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function SocialButton({
  colors,
  icon,
  iconColor,
  label,
  onPress,
  busy,
}: {
  colors: ReturnType<typeof useTheme>['colors'];
  icon: string;
  iconColor: string;
  label: string;
  onPress: () => void;
  busy: boolean;
}) {
  const styles = makeStyles(colors);
  return (
    <Pressable
      style={({ pressed }) => [styles.socialBtn, pressed && styles.btnPressed]}
      onPress={onPress}
      disabled={busy}
    >
      {busy ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          <Text style={[styles.socialIcon, { color: iconColor }]}>{icon}</Text>
          <Text style={styles.socialLabel}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    wrap: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    wrapCompact: {
      marginBottom: 0,
    },
    sectionTitle: {
      color: colors.textMuted,
      fontSize: font.small,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      textAlign: 'center',
    },
    socialBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      minHeight: 52,
    },
    btnPressed: { opacity: 0.88 },
    socialIcon: {
      fontSize: 20,
      fontWeight: '900',
      width: 24,
      textAlign: 'center',
    },
    socialLabel: {
      color: colors.text,
      fontSize: font.body,
      fontWeight: '800',
    },
    emailToggle: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    emailToggleText: {
      color: colors.primary,
      fontSize: font.small,
      fontWeight: '800',
    },
    emailCard: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
      gap: spacing.sm,
    },
    modeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    modeTab: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      alignItems: 'center',
      backgroundColor: colors.card,
    },
    modeTabActive: {
      backgroundColor: colors.primary,
    },
    modeTabText: {
      color: colors.textMuted,
      fontWeight: '800',
      fontSize: font.small,
    },
    modeTabTextActive: {
      color: colors.text,
    },
    input: {
      color: colors.text,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: font.body,
      fontWeight: '600',
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
      minHeight: 48,
      justifyContent: 'center',
    },
    primaryBtnText: {
      color: colors.text,
      fontWeight: '900',
      fontSize: font.body,
    },
    backLink: {
      color: colors.textMuted,
      fontSize: font.small,
      fontWeight: '700',
      textAlign: 'center',
      paddingTop: spacing.xs,
    },
    signedInCard: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    signedInRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    providerIcon: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.primary,
      width: 24,
      textAlign: 'center',
    },
    signedInBody: { flex: 1 },
    signedInLabel: {
      color: colors.textMuted,
      fontSize: font.small,
      fontWeight: '700',
    },
    signedInEmail: {
      color: colors.text,
      fontSize: font.body,
      fontWeight: '800',
    },
    signOutBtn: {
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
    },
    signOutText: {
      color: colors.primary,
      fontSize: font.small,
      fontWeight: '800',
    },
    hintCard: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: spacing.md,
    },
    hintText: {
      color: colors.textMuted,
      fontSize: font.small,
      textAlign: 'center',
    },
    guestBtn: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
    },
    guestBtnText: {
      color: colors.textMuted,
      fontSize: font.small,
      fontWeight: '700',
    },
  });
}
