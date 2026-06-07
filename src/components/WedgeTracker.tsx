import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CATEGORY_LIST, CATEGORY_WEDGES } from '../lib/categoryTheme';
import type { Category } from '../types';
import { colors, radius, spacing } from '../theme';

interface Props {
  collected: Category[];
  size?: 'sm' | 'md';
}

/** Category wedge progress — sleek chips that light up when collected. */
export function WedgeTracker({ collected, size = 'sm' }: Props) {
  const count = collected.length;
  const total = CATEGORY_LIST.length;
  const chipH = size === 'sm' ? 34 : 42;
  const iconSize = size === 'sm' ? 13 : 16;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.label}>Category wedges</Text>
        <Text style={styles.progress}>
          {count}/{total}
        </Text>
      </View>

      <View style={styles.track}>
        {CATEGORY_LIST.map((cat) => {
          const theme = CATEGORY_WEDGES[cat];
          const got = collected.includes(cat);
          return (
            <View
              key={cat}
              style={[
                styles.trackSegment,
                { backgroundColor: got ? theme.fill : 'rgba(255,255,255,0.06)' },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.row}>
        {CATEGORY_LIST.map((cat) => {
          const theme = CATEGORY_WEDGES[cat];
          const got = collected.includes(cat);
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
              ]}
              accessibilityLabel={`${theme.label}${got ? ', collected' : ''}`}
            >
              <Text style={{ fontSize: iconSize, opacity: got ? 1 : 0.35 }}>{theme.icon}</Text>
              {got && <View style={[styles.check, { backgroundColor: theme.fill }]} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
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
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
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
    gap: 6,
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
  check: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
