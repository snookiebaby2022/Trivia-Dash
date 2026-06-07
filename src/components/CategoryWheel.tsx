import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CATEGORY_LIST, CATEGORY_WEDGES } from '../lib/categoryTheme';
import { colors, font, spacing } from '../theme';

const ORBIT_R = 58;
const NODE = 40;
const ORBIT_SIZE = ORBIT_R * 2 + NODE;
const CENTER = ORBIT_SIZE / 2;

/** Home-screen category orbit — modern ring of wedge-colored nodes. */
export function CategoryWheel() {
  const n = CATEGORY_LIST.length;

  return (
    <View style={styles.wrap}>
      <View style={[styles.orbit, { width: ORBIT_SIZE, height: ORBIT_SIZE }]}>
        <View style={styles.glowRing} />
        <View style={styles.innerRing} />

        {CATEGORY_LIST.map((cat, i) => {
          const theme = CATEGORY_WEDGES[cat];
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;

          return (
            <View
              key={cat}
              style={[
                styles.node,
                {
                  left: CENTER + ORBIT_R * Math.cos(angle) - NODE / 2,
                  top: CENTER + ORBIT_R * Math.sin(angle) - NODE / 2,
                  backgroundColor: `${theme.fill}22`,
                  borderColor: theme.fill,
                  shadowColor: theme.fill,
                },
              ]}
            >
              <Text style={styles.nodeIcon}>{theme.icon}</Text>
            </View>
          );
        })}

        <View style={[styles.hub, { left: CENTER - 28, top: CENTER - 28 }]}>
          <Text style={styles.hubIcon}>🥧</Text>
          <Text style={styles.hubLabel}>7 wedges</Text>
        </View>
      </View>

      <Text style={styles.caption}>Dash through 7 categories · fill the pie</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  nodeIcon: { fontSize: 18 },
  hub: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
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
  hubIcon: { fontSize: 22 },
  hubLabel: {
    color: colors.textFaint,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 1,
    letterSpacing: 0.5,
  },
  caption: {
    color: colors.textMuted,
    fontSize: font.small,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
});
