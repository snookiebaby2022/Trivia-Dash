import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { StyleSheet, Text, View } from 'react-native';

import type { MilestoneHit } from '../types';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

interface Props {
  milestones: MilestoneHit[];
  title?: string;
}

export function MilestoneBanner({milestones, title = 'Milestone unlocked!' }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!milestones.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {milestones.map((m) => (
        <View key={m.kind} style={styles.row}>
          <Text style={styles.emoji}>{m.emoji}</Text>
          <Text style={styles.label}>{m.label}</Text>
        </View>
      ))}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(255, 210, 77, 0.12)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  title: {
    color: colors.gold,
    fontSize: font.small,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '800',
  },
  });
}
