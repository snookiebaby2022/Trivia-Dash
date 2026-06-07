import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import type { CelebrationPayload } from '../lib/celebrations';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  payload: CelebrationPayload | null;
  onDone?: () => void;
}

export function MatchCelebrationOverlay({ payload, onDone }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (!payload) return;

    opacity.setValue(0);
    scale.setValue(0.85);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
      Animated.delay(900),
      Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(() => onDone?.());
  }, [payload, opacity, scale, onDone]);

  if (!payload) return null;

  return (
    <Animated.View style={[styles.wrap, { opacity, transform: [{ scale }] }]} pointerEvents="none">
      <View style={[styles.card, { borderColor: payload.color }]}>
        <Text style={styles.emoji}>{payload.emoji}</Text>
        <Text style={[styles.title, { color: payload.color }]}>{payload.title}</Text>
        {payload.subtitle ? <Text style={styles.subtitle}>{payload.subtitle}</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  card: {
    backgroundColor: 'rgba(11, 11, 22, 0.92)',
    borderRadius: radius.lg,
    borderWidth: 2,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: '88%',
  },
  emoji: {
    fontSize: 42,
  },
  title: {
    fontSize: font.h2,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: font.body,
    fontWeight: '700',
    textAlign: 'center',
  },
});
