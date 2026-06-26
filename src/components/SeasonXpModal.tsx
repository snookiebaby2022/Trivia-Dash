import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { WINS_PER_XP_GAIN, XP_PER_LEVEL } from '../lib/seasonPass';
import type { SeasonXpSnapshot } from '../types';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

interface Props {
  visible: boolean;
  snapshot: SeasonXpSnapshot;
  onDismiss: () => void;
}

export function SeasonXpModal({visible, snapshot, onDismiss }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const progress = snapshot.xpToNextLevel > 0
    ? snapshot.xpInLevel / XP_PER_LEVEL
    : 1;
  const deltaColor =
    snapshot.xpDelta > 0 ? colors.success : snapshot.xpDelta < 0 ? colors.danger : colors.textMuted;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.badge}>SEASON PROGRESS</Text>
          {snapshot.leveledUp && <Text style={styles.levelUp}>⬆ Level up!</Text>}

          <Text style={styles.level}>
            Level <Text style={styles.levelNum}>{snapshot.level}</Text>
            {snapshot.level >= 100 ? '' : ' / 100'}
          </Text>

          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.min(100, progress * 100)}%` }]} />
          </View>
          <Text style={styles.barLabel}>
            {snapshot.xpToNextLevel > 0
              ? `${snapshot.xpInLevel} / ${XP_PER_LEVEL} XP to next level`
              : 'Max level reached'}
          </Text>

          <View style={styles.xpRow}>
            <Text style={styles.xpTotal}>{snapshot.xp.toLocaleString()} XP total</Text>
            {snapshot.xpDelta !== 0 && (
              <Text style={[styles.xpDelta, { color: deltaColor }]}>
                {snapshot.xpDelta > 0 ? '+' : ''}
                {snapshot.xpDelta} this match
              </Text>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{snapshot.wins}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.danger }]}>{snapshot.losses}</Text>
              <Text style={styles.statLabel}>Losses</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {snapshot.winsTowardXp}/{WINS_PER_XP_GAIN}
              </Text>
              <Text style={styles.statLabel}>Wins → XP</Text>
            </View>
          </View>

          <Pressable style={styles.btn} onPress={onDismiss}>
            <Text style={styles.btnText}>Continue</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing.lg,
    alignItems: 'center',
  },
  badge: {
    color: colors.gold,
    fontSize: font.small,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  levelUp: {
    color: colors.success,
    fontSize: font.body,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  level: {
    color: colors.textMuted,
    fontSize: font.h3,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  levelNum: {
    color: colors.gold,
    fontSize: 36,
    fontWeight: '900',
  },
  barTrack: {
    width: '100%',
    height: 10,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  barLabel: {
    color: colors.textMuted,
    fontSize: font.small,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  xpRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: 4,
  },
  xpTotal: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: '900',
  },
  xpDelta: {
    fontSize: font.body,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.success,
    fontSize: font.h2,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.textFaint,
    fontSize: font.small,
    fontWeight: '700',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.cardBorder,
  },
  btn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnText: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '900',
  },
  });
}
