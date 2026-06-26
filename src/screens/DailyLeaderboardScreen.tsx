import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ActivityIndicator, Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarView } from '../components/AvatarView';
import { useProfile } from '../context/ProfileContext';
import { todayKey } from '../lib/daily';
import { fetchDailyLeaderboard } from '../lib/dailyLeaderboard';
import { shareDailyResult } from '../lib/shareCard';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';
import type { DailyLeaderboardEntry } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'DailyLeaderboard'>;

export function DailyLeaderboardScreen({}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { profile } = useProfile();
  const [entries, setEntries] = useState<DailyLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    void fetchDailyLeaderboard(profile).then((rows) => {
      setEntries(rows);
      setLoading(false);
    });
  }, [profile]);

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const yourScore = profile.stats.dailyBests[todayKey()];
  const yourRank = entries.findIndex((e) => e.id === profile.id) + 1;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Text style={styles.banner}>Same 10 questions for everyone · {todayKey()}</Text>
      {yourScore != null && (
        <Pressable
          style={styles.you}
          onPress={() => void shareDailyResult(todayKey(), yourScore, yourRank || 0, profile.username)}
        >
          <Text style={styles.youText}>
            Your best: {yourScore} · Rank #{yourRank || '—'} · Tap to share
          </Text>
        </Pressable>
      )}
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <LbRow item={item} index={index} styles={styles} />
        )}
      />
    </SafeAreaView>
  );
}

function LbRow({
  item,
  index,
  styles,
}: {
  item: DailyLeaderboardEntry;
  index: number;
  styles: ReturnType<typeof makeStyles>;
}) {
  const anim = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 350, delay: index * 50, useNativeDriver: true }).start();
  }, [anim, index]);
  return (
    <Animated.View style={[styles.row, item.isYou && styles.rowYou, { opacity: anim }]}>
      <Text style={styles.rank}>{index + 1}</Text>
      {item.avatar && <AvatarView avatar={item.avatar} size={32} />}
      <Text style={styles.name}>{item.username}</Text>
      <Text style={styles.score}>{item.score}</Text>
    </Animated.View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  banner: { color: colors.textMuted, textAlign: 'center', padding: spacing.md, fontSize: font.small },
  you: { marginHorizontal: spacing.md, padding: spacing.sm, backgroundColor: colors.bgElevated, borderRadius: radius.md },
  youText: { color: colors.primary, textAlign: 'center', fontWeight: '700' },
  list: { padding: spacing.md, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  rowYou: { borderWidth: 1, borderColor: colors.primary },
  rank: { color: colors.text, fontWeight: '900', width: 28 },
  name: { flex: 1, color: colors.text, fontWeight: '700' },
  score: { color: colors.gold, fontWeight: '900' },
  });
}
