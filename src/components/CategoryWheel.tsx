import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CATEGORY_LIST, CATEGORY_WEDGES } from '../lib/categoryTheme';
import { countEarnedWedges, getWedgeProgress, WEDGE_UNLOCK_CORRECT } from '../lib/wedges';
import type { Profile } from '../types';
import type { ThemeColors } from '../theme';
import { font, spacing } from '../theme';

const ORBIT_R = 82;
const NODE = 32;
const ORBIT_SIZE = ORBIT_R * 2 + NODE;
const CENTER = ORBIT_SIZE / 2;

interface Props {
  profile?: Profile | null;
  onPress?: () => void;
}

/** Home-screen category orbit — earned wedges glow, others show progress. */
export function CategoryWheel({profile, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const n = CATEGORY_LIST.length;
  const earned = profile ? countEarnedWedges(profile) : 0;

  return (
    <Pressable style={styles.wrap} onPress={onPress}>
      <View style={[styles.orbit, { width: ORBIT_SIZE, height: ORBIT_SIZE }]}>
        <View style={styles.glowRing} />
        <View style={styles.innerRing} />

        {CATEGORY_LIST.map((cat, i) => {
          const theme = CATEGORY_WEDGES[cat];
          const progress = profile ? getWedgeProgress(profile, cat) : null;
          const got = progress?.earned ?? false;
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;

          return (
            <View
              key={cat}
              style={[
                styles.node,
                {
                  left: CENTER + ORBIT_R * Math.cos(angle) - NODE / 2,
                  top: CENTER + ORBIT_R * Math.sin(angle) - NODE / 2,
                  backgroundColor: got ? `${theme.fill}44` : `${theme.fill}14`,
                  borderColor: got ? theme.fill : `${theme.fill}55`,
                  shadowColor: theme.fill,
                  opacity: got ? 1 : 0.85,
                },
              ]}
            >
              <Text style={[styles.nodeIcon, !got && styles.nodeIconDim]}>{theme.icon}</Text>
              {got && <View style={[styles.earnedDot, { backgroundColor: theme.fill }]} />}
            </View>
          );
        })}

        <View style={[styles.hub, { left: CENTER - 32, top: CENTER - 32 }]}>
          <Text style={styles.hubCount}>
            {earned}/{n}
          </Text>
          <Text style={styles.hubLabel}>wedges</Text>
        </View>
      </View>

      <Text style={styles.caption}>
        {WEDGE_UNLOCK_CORRECT} correct per category · tap for wedge profile
      </Text>
    </Pressable>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  orbit: {
    position: 'relative',
  },
  glowRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ORBIT_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  innerRing: {
    position: 'absolute',
    left: (ORBIT_SIZE - (ORBIT_R * 2 - 8)) / 2,
    top: (ORBIT_SIZE - (ORBIT_R * 2 - 8)) / 2,
    width: ORBIT_R * 2 - 8,
    height: ORBIT_R * 2 - 8,
    borderRadius: ORBIT_R - 4,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 255, 0.25)',
    borderStyle: 'dashed',
  },
  node: {
    position: 'absolute',
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  nodeIcon: { fontSize: 16 },
  nodeIconDim: { opacity: 0.55 },
  earnedDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  hub: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  hubCount: {
    color: colors.gold,
    fontSize: font.h3,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  hubLabel: {
    color: colors.textFaint,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 1,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  caption: {
    color: colors.textMuted,
    fontSize: font.small,
    marginTop: spacing.sm,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  });
}
