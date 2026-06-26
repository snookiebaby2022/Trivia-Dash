import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import {
  accuracy,
  formatAvgMs,
  maxScore,
  statusLabel,
} from '../lib/matchStats';
import type { PlayerLiveStats, PlayerStatus } from '../types';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';
import { AvatarView } from './AvatarView';

interface Props {
  players: PlayerLiveStats[];
  layout: 'duel' | 'quad';
  questionIndex: number;
  totalQuestions: number;
  live?: boolean;
}

type PanelStyles = ReturnType<typeof makeStyles>;

function statusColors(colors: ThemeColors): Record<PlayerStatus, string> {
  return {
    idle: colors.textFaint,
    thinking: colors.warning,
    answered: colors.primary,
    correct: colors.success,
    wrong: colors.danger,
    timeout: colors.textMuted,
  };
}

/** Real-time player stat cards — score, accuracy, streak, live status. */
export function LiveStatsPanel({
  players,
  layout,
  questionIndex,
  totalQuestions,
  live = true,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const statusColorMap = useMemo(() => statusColors(colors), [colors]);

  const sorted = [...players].sort((a, b) => a.rank - b.rank);
  const leaderScore = maxScore(players);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {live && <LivePulse styles={styles} />}
          <Text style={styles.headerTitle}>{live ? 'Live stats' : 'Match stats'}</Text>
        </View>
        <Text style={styles.headerMeta}>
          Q{questionIndex}/{totalQuestions}
        </Text>
      </View>

      {layout === 'duel' ? (
        <View style={styles.duelRow}>
          {sorted.map((p) => (
            <PlayerStatCard
              key={p.id}
              player={p}
              leaderScore={leaderScore}
              compact
              styles={styles}
              colors={colors}
              statusColorMap={statusColorMap}
            />
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quadScroll}
        >
          {sorted.map((p) => (
            <PlayerStatCard
              key={p.id}
              player={p}
              leaderScore={leaderScore}
              styles={styles}
              colors={colors}
              statusColorMap={statusColorMap}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function LivePulse({ styles }: { styles: PanelStyles }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={styles.pulseWrap}>
      <Animated.View style={[styles.pulseDot, { opacity }]} />
    </View>
  );
}

function PlayerStatCard({
  player,
  leaderScore,
  compact,
  styles,
  colors,
  statusColorMap,
}: {
  player: PlayerLiveStats;
  leaderScore: number;
  compact?: boolean;
  styles: PanelStyles;
  colors: ThemeColors;
  statusColorMap: Record<PlayerStatus, string>;
}) {
  const acc = accuracy(player);
  const barPct = Math.min(100, (player.score / leaderScore) * 100);
  const statusColor = statusColorMap[player.status];

  return (
    <View
      style={[styles.card, compact && styles.cardCompact, player.isYou && styles.cardYou]}
    >
      <View style={styles.cardTop}>
        <View style={styles.identity}>
          <AvatarView avatar={player.avatar} size={compact ? 32 : 36} showRing={player.isYou} />
          <View style={styles.nameCol}>
            <Text style={styles.name} numberOfLines={1}>
              {player.name}
              {player.isYou ? ' (you)' : ''}
            </Text>
            <Text style={styles.subMeta}>
              {player.isBot ? 'BOT' : player.isYou ? 'YOU' : 'RIVAL'}
              {player.streak > 1 ? ` · 🔥${player.streak}` : ''}
            </Text>
          </View>
        </View>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{player.rank}</Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.score}>{player.score}</Text>
        <Text style={styles.scoreLabel}>pts</Text>
        {player.lastPoints != null && player.lastPoints > 0 && (
          <Text style={styles.lastGain}>+{player.lastPoints}</Text>
        )}
      </View>

      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${barPct}%`,
              backgroundColor: player.isYou ? colors.primary : colors.accent,
            },
          ]}
        />
      </View>

      <View style={styles.metricsRow}>
        <Metric label="Acc" value={`${acc}%`} styles={styles} />
        <Metric label="Hits" value={`${player.correct}/${player.answered}`} styles={styles} />
        <Metric label="Avg" value={formatAvgMs(player.avgMs)} styles={styles} />
      </View>

      <View
        style={[
          styles.statusPill,
          { borderColor: `${statusColor}55`, backgroundColor: `${statusColor}18` },
        ]}
      >
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusLabel(player.status)}
        </Text>
      </View>
    </View>
  );
}

function Metric({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: PanelStyles;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      color: colors.text,
      fontSize: font.small,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    headerMeta: {
      color: colors.textFaint,
      fontSize: 11,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    pulseWrap: {
      width: 10,
      height: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pulseDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.success,
    },
    duelRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    quadScroll: {
      gap: spacing.sm,
      paddingRight: spacing.sm,
    },
    card: {
      width: 168,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.sm,
    },
    cardCompact: {
      flex: 1,
      width: undefined,
      minWidth: 0,
    },
    cardYou: {
      borderColor: `${colors.primary}66`,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    identity: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    nameCol: { flex: 1 },
    name: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '800',
    },
    subMeta: {
      color: colors.textFaint,
      fontSize: 9,
      fontWeight: '700',
      marginTop: 2,
      letterSpacing: 0.5,
    },
    rankBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.pill,
      backgroundColor: colors.bgElevated,
    },
    rankText: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: '900',
      fontVariant: ['tabular-nums'],
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      marginBottom: 6,
    },
    score: {
      color: colors.text,
      fontSize: font.h2,
      fontWeight: '900',
      fontVariant: ['tabular-nums'],
    },
    scoreLabel: {
      color: colors.textFaint,
      fontSize: 11,
      fontWeight: '700',
    },
    lastGain: {
      color: colors.success,
      fontSize: 11,
      fontWeight: '800',
      marginLeft: 'auto',
      fontVariant: ['tabular-nums'],
    },
    barTrack: {
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.bgElevated,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    barFill: {
      height: 4,
      borderRadius: radius.pill,
    },
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    metric: { alignItems: 'center', flex: 1 },
    metricLabel: {
      color: colors.textFaint,
      fontSize: 9,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    metricValue: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '800',
      marginTop: 2,
      fontVariant: ['tabular-nums'],
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '800',
    },
  });
}
