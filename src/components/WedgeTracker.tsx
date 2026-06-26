import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { StyleSheet, Text, View } from 'react-native';

import { CATEGORY_LIST, CATEGORY_WEDGES } from '../lib/categoryTheme';
import { getEarnedWedges, getWedgeProgress, WEDGE_UNLOCK_CORRECT } from '../lib/wedges';
import type { Category, Profile } from '../types';
import type { ThemeColors } from '../theme';
import { radius, spacing } from '../theme';

interface Props {
  /** Lifetime earned wedges — pass profile or explicit list. */
  profile?: Profile | null;
  collected?: Category[];
  highlight?: Category;
  size?: 'sm' | 'md';
}

/** Category wedge progress — 50 lifetime correct per category. */
export function WedgeTracker({profile, collected, highlight, size = 'sm' }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const earned = collected ?? (profile ? getEarnedWedges(profile) : []);
  const count = earned.length;
  const total = CATEGORY_LIST.length;
  const chipH = size === 'sm' ? 34 : 42;
  const iconSize = size === 'sm' ? 13 : 16;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.label}>Category wedges</Text>
        <Text style={styles.progress}>
          {count}/{total} · {WEDGE_UNLOCK_CORRECT} correct each
        </Text>
      </View>

      <View style={styles.track}>
        {CATEGORY_LIST.map((cat) => {
          const theme = CATEGORY_WEDGES[cat];
          const got = earned.includes(cat);
          const wedgeProgress = profile ? getWedgeProgress(profile, cat) : null;
          const pct = wedgeProgress ? wedgeProgress.current / wedgeProgress.target : got ? 1 : 0;
          return (
            <View
              key={cat}
              style={[
                styles.trackSegment,
                {
                  backgroundColor: got
                    ? theme.fill
                    : `rgba(255,255,255,${0.04 + pct * 0.12})`,
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.row}>
        {CATEGORY_LIST.map((cat) => {
          const theme = CATEGORY_WEDGES[cat];
          const got = earned.includes(cat);
          const wedgeProgress = profile ? getWedgeProgress(profile, cat) : null;
          const isHighlight = highlight === cat;
          return (
            <View
              key={cat}
              style={[
                styles.chip,
                { height: chipH, minWidth: chipH },
                got
                  ? {
                      backgroundColor: `${theme.fill}28`,
                      borderColor: theme.fill,
                      shadowColor: theme.fill,
                      shadowOpacity: 0.5,
                      shadowRadius: 6,
                      elevation: 3,
                    }
                  : styles.chipEmpty,
                isHighlight && !got && styles.chipHighlight,
              ]}
              accessibilityLabel={`${theme.label}${got ? ', earned' : ''}`}
            >
              <Text style={{ fontSize: iconSize, opacity: got ? 1 : 0.4 }}>{theme.icon}</Text>
              {got ? (
                <View style={[styles.check, { backgroundColor: theme.fill }]} />
              ) : wedgeProgress && wedgeProgress.current > 0 ? (
                <Text style={styles.chipCount}>{wedgeProgress.current}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  wrap: {
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  progress: {
    color: colors.textFaint,
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
    textAlign: 'right',
  },
  track: {
    flexDirection: 'row',
    height: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
    gap: 2,
    marginBottom: spacing.sm,
  },
  trackSegment: {
    flex: 1,
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 5,
  },
  chip: {
    borderRadius: radius.sm + 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chipEmpty: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipHighlight: {
    borderColor: colors.primary,
  },
  check: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipCount: {
    position: 'absolute',
    bottom: 1,
    right: 2,
    color: colors.textFaint,
    fontSize: 8,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  });
}
