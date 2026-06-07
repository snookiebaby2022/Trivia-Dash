import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '../context/ProfileContext';
import { AvatarView } from '../components/AvatarView';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchLeaderboard } from '../lib/leaderboard';
import type { RootStackParamList } from '../navigation';
import { colors, font, radius, spacing } from '../theme';
import type { LeaderboardEntry } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Leaderboard'>;

export function LeaderboardScreen(_props: Props) {
  const { profile } = useProfile();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    let mounted = true;
    fetchLeaderboard(profile).then((rows) => {
      if (mounted) {
        setEntries(rows);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [profile]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const medal = (rank: number) =>
    rank === 1 ? colors.gold : rank === 2 ? colors.silver : rank === 3 ? colors.bronze : null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {!isSupabaseConfigured && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Demo board · add Supabase keys in .env for live global rankings
          </Text>
        </View>
      )}
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isYou = item.id === profile?.id;
          const m = medal(item.rank);
          return (
            <View style={[styles.row, isYou && styles.rowYou]}>
              <View style={[styles.rankBadge, m ? { backgroundColor: m } : undefined]}>
                <Text style={[styles.rankNum, m ? { color: colors.bg } : undefined]}>
                  {item.rank}
                </Text>
              </View>
              {item.avatar && <AvatarView avatar={item.avatar} size={36} />}
              <Text style={[styles.name, isYou && { color: colors.primary }]} numberOfLines={1}>
                {item.username}
              </Text>
              <View style={styles.rightCol}>
                <Text style={styles.elo}>{item.elo}</Text>
                <Text style={styles.wins}>{item.wins}W</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    backgroundColor: colors.bgElevated,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  noticeText: {
    color: colors.textMuted,
    fontSize: font.small,
    textAlign: 'center',
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  rowYou: {
    borderColor: colors.primary,
    backgroundColor: colors.bgElevated,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '900',
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: font.body,
    fontWeight: '700',
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  elo: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '900',
  },
  wins: {
    color: colors.textFaint,
    fontSize: font.small,
  },
});
