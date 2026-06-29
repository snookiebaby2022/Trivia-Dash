import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import {
  configuredLeaderboardKeys,
  ensurePlayGamesSignedIn,
  isPlayGamesConfigured,
  isPlayGamesSignedIn,
  LEADERBOARD_LABELS,
  showPlayAchievements,
  showPlayLeaderboard,
} from '../lib/playGames';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

export function PlayGamesPanel() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const boardKeys = configuredLeaderboardKeys();
  const visible = Platform.OS === 'android' && isPlayGamesConfigured();
  const needsRealIds = visible && boardKeys.length === 0;

  const refresh = useCallback(async () => {
    if (!visible) return;
    setSignedIn(await isPlayGamesSignedIn());
  }, [visible]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!visible) return null;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🎮 Google Play Games</Text>
      <Text style={styles.sub}>Native leaderboards (Android)</Text>

      {needsRealIds && (
        <Text style={styles.warn}>
          Add real Leaderboard IDs in .env (CgkI…), then rebuild the app. Highest Score is still a
          placeholder.
        </Text>
      )}

      {signedIn === null ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : !signedIn ? (
        <Pressable
          style={styles.primaryBtn}
          disabled={busy || boardKeys.length === 0}
          onPress={() => void run(async () => setSignedIn(await ensurePlayGamesSignedIn()))}
        >
          <Text style={styles.primaryText}>Sign in with Play Games</Text>
        </Pressable>
      ) : (
        <>
          {boardKeys.map((key) => (
            <Pressable
              key={key}
              style={styles.rowBtn}
              disabled={busy}
              onPress={() => void run(() => showPlayLeaderboard(key))}
            >
              <Text style={styles.rowText}>{LEADERBOARD_LABELS[key]}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
          <Pressable
            style={styles.rowBtn}
            disabled={busy}
            onPress={() => void run(showPlayAchievements)}
          >
            <Text style={styles.rowText}>Achievements</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.bgElevated,
      gap: spacing.sm,
    },
    title: {
      color: colors.gold,
      fontSize: font.body,
      fontWeight: '900',
      textAlign: 'center',
    },
    sub: {
      color: colors.textMuted,
      fontSize: font.small,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    warn: {
      color: colors.warning,
      fontSize: font.small,
      textAlign: 'center',
      lineHeight: 18,
    },
    hint: {
      color: colors.textFaint,
      fontSize: 11,
      textAlign: 'center',
    },
    loader: { marginVertical: spacing.sm },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    primaryText: {
      color: '#fff',
      fontWeight: '800',
    },
    rowBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    rowText: {
      color: colors.text,
      fontWeight: '700',
    },
    chevron: {
      color: colors.textFaint,
      fontSize: font.h3,
    },
  });
}
