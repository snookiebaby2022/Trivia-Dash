import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '../context/ProfileContext';
import { AvatarView } from '../components/AvatarView';
import { PlayGamesPanel } from '../components/PlayGamesPanel';
import { WeeklyFriendFilter } from '../components/WeeklyFriendFilter';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchLeaderboard, fetchScoreLeaderboard } from '../lib/leaderboard';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';
import type { LeaderboardEntry } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Leaderboard'>;
type BoardMode = 'elo' | 'score';

function AnimatedRow({
  item,
  index,
  isYou,
  medal,
  mode,
  styles,
  colors,
}: {
  item: LeaderboardEntry;
  index: number;
  isYou: boolean;
  medal: string | null;
  mode: BoardMode;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  const slide = useRef(new Animated.Value(40)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const primary = mode === 'score' ? (item.bestMatchScore ?? 0) : item.elo;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: 0,
        duration: 420,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 380,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();

    if (item.rank <= 3) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.04, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [index, item.rank, slide, fade, pulse]);

  return (
    <Animated.View
      style={[
        styles.row,
        isYou && styles.rowYou,
        item.rank <= 3 && styles.rowPodium,
        {
          opacity: fade,
          transform: [{ translateY: slide }, { scale: pulse }],
        },
      ]}
    >
      <View style={[styles.rankBadge, medal ? { backgroundColor: medal } : undefined]}>
        <Text style={[styles.rankNum, medal ? { color: colors.bg } : undefined]}>{item.rank}</Text>
      </View>
      {item.avatar && <AvatarView avatar={item.avatar} size={40} showRing={item.rank <= 3} />}
      <View style={styles.nameCol}>
        <Text style={[styles.name, isYou && { color: colors.primary }]} numberOfLines={1}>
          {item.username}
        </Text>
        {item.rank === 1 && <Text style={styles.crown}>👑 Champion</Text>}
      </View>
      <View style={styles.rightCol}>
        <Text style={styles.elo}>{primary}</Text>
        <Text style={styles.wins}>{mode === 'score' ? 'best run' : `${item.wins}W`}</Text>
      </View>
    </Animated.View>
  );
}

export function LeaderboardScreen(_props: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { profile } = useProfile();
  const [mode, setMode] = useState<BoardMode>('score');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const headerGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!profile) return;
    let mounted = true;
    setLoading(true);
    const load = mode === 'score' ? fetchScoreLeaderboard(profile) : fetchLeaderboard(profile);
    void load.then((rows) => {
      if (mounted) {
        setEntries(rows);
        setLive(isSupabaseConfigured && !rows[0]?.id.startsWith('mock_'));
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [profile, mode]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(headerGlow, { toValue: 1, duration: 1800, useNativeDriver: false }),
        Animated.timing(headerGlow, { toValue: 0, duration: 1800, useNativeDriver: false }),
      ])
    ).start();
  }, [headerGlow]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const medal = (rank: number) =>
    rank === 1 ? colors.gold : rank === 2 ? colors.silver : rank === 3 ? colors.bronze : null;

  const glowBorder = headerGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(124, 92, 255, 0.2)', 'rgba(255, 210, 77, 0.55)'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Animated.View style={[styles.hero, { borderColor: glowBorder }]}>
        <Text style={styles.heroTitle}>🏅 Global Top 100</Text>
        <Text style={styles.heroSub}>
          {live ? 'Live online rankings' : 'Demo data · sign in & play to appear when online'}
        </Text>
      </Animated.View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, mode === 'score' && styles.tabOn]}
          onPress={() => setMode('score')}
        >
          <Text style={[styles.tabText, mode === 'score' && styles.tabTextOn]}>High score</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, mode === 'elo' && styles.tabOn]}
          onPress={() => setMode('elo')}
        >
          <Text style={[styles.tabText, mode === 'elo' && styles.tabTextOn]}>ELO rating</Text>
        </Pressable>
      </View>

      <WeeklyFriendFilter entries={entries.map((e) => ({ ...e, score: e.bestMatchScore ?? e.elo }))} />

      <PlayGamesPanel />

      {!live && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Play a match while online to submit your score · Supabase syncs top 100 globally
          </Text>
        </View>
      )}
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          profile ? (
            <Text style={styles.youHint}>
              Your best: {profile.stats.bestMatchScore ?? 0} pts · ELO {profile.elo}
            </Text>
          ) : null
        }
        renderItem={({ item, index }) => (
          <AnimatedRow
            item={item}
            index={index}
            isYou={item.id === profile?.id}
            medal={medal(item.rank)}
            mode={mode}
            styles={styles}
            colors={colors}
          />
        )}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
  hero: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
  },
  heroTitle: {
    color: colors.gold,
    fontSize: font.h2,
    fontWeight: '900',
  },
  heroSub: {
    color: colors.textMuted,
    fontSize: font.small,
    marginTop: 4,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  tabOn: {
    borderColor: colors.primary,
    backgroundColor: colors.bgElevated,
  },
  tabText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: font.small,
  },
  tabTextOn: {
    color: colors.primary,
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
  youHint: {
    color: colors.textFaint,
    fontSize: font.small,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
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
  rowPodium: {
    borderWidth: 1.5,
  },
  rankBadge: {
    width: 36,
    height: 36,
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
  nameCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '700',
  },
  crown: {
    color: colors.gold,
    fontSize: font.small,
    fontWeight: '800',
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
}
