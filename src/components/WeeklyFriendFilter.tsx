import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { font, radius, spacing } from '../theme';
import type { ThemeColors } from '../theme';

interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  elo: number;
  isYou?: boolean;
}

interface Props {
  entries: LeaderboardEntry[];
}

type Filter = 'all' | 'friends' | 'you';

export function WeeklyFriendFilter({ entries }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    switch (filter) {
      case 'friends':
        // In a real app, filter by friend IDs from the friends system
        return entries.filter((e) => !e.isYou).slice(0, 10);
      case 'you':
        return entries.filter((e) => e.isYou);
      default:
        return entries;
    }
  }, [entries, filter]);

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Global' },
    { id: 'friends', label: 'Friends' },
    { id: 'you', label: 'You' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <Pressable
            key={f.id}
            style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map((entry, i) => (
          <View
            key={entry.id}
            style={[styles.row, entry.isYou && styles.rowYou]}
          >
            <Text style={[styles.rank, entry.isYou && styles.rankYou]}>
              {i + 1}
            </Text>
            <View style={styles.rowBody}>
              <Text style={[styles.name, entry.isYou && styles.nameYou]}>
                {entry.username}
              </Text>
              <Text style={styles.elo}>{entry.elo} ELO</Text>
            </View>
            <Text style={[styles.score, entry.isYou && styles.scoreYou]}>
              {entry.score}
            </Text>
          </View>
        ))}
        {filtered.length === 0 && (
          <Text style={styles.empty}>No entries found</Text>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { gap: spacing.sm },
    filterRow: { flexDirection: 'row', gap: spacing.sm },
    filterChip: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { color: colors.textMuted, fontWeight: '800', fontSize: font.small },
    filterTextActive: { color: colors.text },
    list: { maxHeight: 400 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.sm,
      borderRadius: radius.sm,
      gap: spacing.sm,
    },
    rowYou: { backgroundColor: colors.bgElevated, borderRadius: radius.sm },
    rank: { color: colors.textMuted, fontSize: font.body, fontWeight: '900', width: 28, textAlign: 'center' },
    rankYou: { color: colors.gold },
    rowBody: { flex: 1 },
    name: { color: colors.text, fontSize: font.body, fontWeight: '700' },
    nameYou: { color: colors.gold, fontWeight: '900' },
    elo: { color: colors.textFaint, fontSize: font.small },
    score: { color: colors.textMuted, fontSize: font.body, fontWeight: '900' },
    scoreYou: { color: colors.gold },
    empty: { color: colors.textFaint, textAlign: 'center', paddingVertical: spacing.lg },
  });
}
