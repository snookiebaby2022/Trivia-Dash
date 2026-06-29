import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useProfile } from '../context/ProfileContext';
import { formatCoins } from '../lib/coins';
import { rankTitle } from '../lib/elo';
import { canPlayDailyToday } from '../lib/monetization';
import { font, radius, spacing } from '../theme';
import type { ThemeColors } from '../theme';

export function StreakWidget() {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!profile) return null;

  const rank = rankTitle(profile.elo);
  const dailyReady = canPlayDailyToday(profile);
  const streak = profile.dailyStreak;
  const coins = profile.coins ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.gold }]}>🔥 {streak}</Text>
          <Text style={styles.statLabel}>Daily streak</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.primary }]}>🪙 {formatCoins(coins)}</Text>
          <Text style={styles.statLabel}>Coins</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: rank.color }]}>⚡ {profile.elo}</Text>
          <Text style={styles.statLabel}>{rank.title}</Text>
        </View>
      </View>
      {dailyReady && (
        <View style={[styles.alertBar, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
          <Text style={[styles.alertText, { color: colors.success }]}>📅 Daily challenge ready!</Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.md,
      gap: spacing.sm,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: font.body, fontWeight: '900' },
    statLabel: { color: colors.textFaint, fontSize: 10, marginTop: 2 },
    divider: { width: 1, height: 28, backgroundColor: colors.cardBorder },
    alertBar: {
      borderRadius: radius.sm,
      borderWidth: 1,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
    },
    alertText: { fontSize: font.small, fontWeight: '800' },
  });
}
