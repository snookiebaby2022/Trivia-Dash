import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { CATEGORY_LIST } from '../lib/categoryTheme';
import { rankTitle } from '../lib/elo';
import { getEventCount, getSessionCount, getTotalPlayTimeMs } from '../lib/analytics';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';
import type { Category } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

export function StatsScreen({}: Props) {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!profile) return null;

  const rank = rankTitle(profile.elo);
  const total = profile.wins + profile.losses + profile.draws;
  const winRate = total ? Math.round((profile.wins / total) * 100) : 0;
  const avgCorrect = total ? (profile.stats.totalCorrect / total).toFixed(1) : '0';

  const playTimeMs = getTotalPlayTimeMs();
  const hours = Math.floor(playTimeMs / 3600000);
  const mins = Math.floor((playTimeMs % 3600000) / 60000);
  const playTimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const categoryStats = CATEGORY_LIST.map((cat) => {
    const correct = profile.stats.categoryCorrect[cat as Category] ?? 0;
    const plays = profile.stats.categoryPlays?.[cat as Category]?.plays ?? 0;
    const maxCorrect = 100;
    const percentage = maxCorrect ? Math.min(100, Math.round((correct / maxCorrect) * 100)) : 0;
    return { cat, correct, plays, percentage };
  }).sort((a, b) => b.correct - a.correct);

  const maxCorrect = Math.max(...categoryStats.map((c) => c.correct), 1);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Your Stats</Text>

        <View style={styles.statsGrid}>
          <StatCard label="ELO" value={String(profile.elo)} sub={rank.title} color={rank.color} colors={colors} />
          <StatCard label="Wins" value={String(profile.wins)} sub={`${winRate}% win rate`} color={colors.success} colors={colors} />
          <StatCard label="Matches" value={String(total)} sub={`${avgCorrect} avg correct`} color={colors.primary} colors={colors} />
          <StatCard label="Best Streak" value={String(profile.bestStreak)} sub="in a single match" color={colors.accent} colors={colors} />
          <StatCard label="Daily Streak" value={String(profile.dailyStreak)} sub="consecutive days" color={colors.gold} colors={colors} />
          <StatCard label="Play Time" value={playTimeStr} sub={`${getSessionCount()} sessions`} color={colors.silver} colors={colors} />
          <StatCard label="Total Correct" value={String(profile.stats.totalCorrect)} sub="lifetime answers" color={colors.warning} colors={colors} />
          <StatCard label="Best Score" value={String(profile.stats.bestMatchScore ?? 0)} sub="single match record" color={colors.gold} colors={colors} />
        </View>

        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        <View style={styles.categorySection}>
          {categoryStats.map(({ cat, correct, percentage }) => (
            <View key={cat} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{cat}</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: colors.primary }]} />
              </View>
              <Text style={styles.categoryCount}>{correct}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  colors,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  colors: ThemeColors;
}) {
  return (
    <View style={{ flex: 1, minWidth: '47%' }}>
      <View style={{ backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md, alignItems: 'center' }}>
        <Text style={{ color: colors.textMuted, fontSize: font.small, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
        <Text style={{ color, fontSize: font.h1, fontWeight: '900', marginTop: 4 }}>{value}</Text>
        <Text style={{ color: colors.textFaint, fontSize: font.small, marginTop: 2 }}>{sub}</Text>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    title: { color: colors.gold, fontSize: font.h2, fontWeight: '900', textAlign: 'center', marginBottom: spacing.lg },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
    sectionTitle: { color: colors.text, fontSize: font.h3, fontWeight: '900', marginBottom: spacing.md },
    categorySection: { gap: spacing.sm },
    categoryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    categoryName: { color: colors.textMuted, fontSize: font.small, width: 100, fontWeight: '700' },
    barBg: { flex: 1, height: 12, backgroundColor: colors.bgElevated, borderRadius: 6, overflow: 'hidden' },
    barFill: { height: 12, borderRadius: 6 },
    categoryCount: { color: colors.text, fontSize: font.small, fontWeight: '800', width: 30, textAlign: 'right' },
  });
}
