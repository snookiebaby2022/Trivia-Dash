import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useProfile } from '../context/ProfileContext';
import { isSupabaseConfigured } from '../lib/supabase';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

export function GoogleSignInButton() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { authUser, isSignedIn, signInWithGoogle, signOutGoogle, authBusy } = useProfile();

  if (!isSupabaseConfigured) {
    return (
      <View style={styles.hintCard}>
        <Text style={styles.hintText}>
          Google sign-in needs Supabase keys in .env
        </Text>
      </View>
    );
  }

  if (isSignedIn && authUser) {
    return (
      <View style={styles.signedInCard}>
        <View style={styles.signedInRow}>
          <Text style={styles.googleG}>G</Text>
          <View style={styles.signedInBody}>
            <Text style={styles.signedInLabel}>Signed in with Google</Text>
            <Text style={styles.signedInEmail} numberOfLines={1}>
              {authUser.email}
            </Text>
          </View>
        </View>
        <Pressable
          style={styles.signOutBtn}
          onPress={() => void signOutGoogle()}
          disabled={authBusy}
        >
          <Text style={styles.signOutText}>{authBusy ? 'Signing out…' : 'Sign out'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
      onPress={() => void signInWithGoogle()}
      disabled={authBusy}
    >
      {authBusy ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          <Text style={styles.googleG}>G</Text>
          <Text style={styles.btnText}>Continue with Google</Text>
        </>
      )}
    </Pressable>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  btn: {
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
  btnPressed: {
    opacity: 0.88,
  },
  googleG: {
    fontSize: 20,
    fontWeight: '900',
    color: '#4285F4',
    width: 24,
    textAlign: 'center',
  },
  btnText: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '800',
  },
  signedInCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
  },
  signedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  signedInBody: {
    flex: 1,
  },
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
  },
  hintText: {
    color: colors.textMuted,
    fontSize: font.small,
    textAlign: 'center',
  },
  });
}
