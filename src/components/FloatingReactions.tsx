import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import type { PartyReaction } from '../types';

interface Props {
  reactions: PartyReaction[];
}

function Floater({ reaction }: { reaction: PartyReaction }) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(y, { toValue: -72, duration: 1400, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 1400, useNativeDriver: true }),
    ]).start();
  }, [y, opacity]);

  return (
    <Animated.View style={[styles.floater, { opacity, transform: [{ translateY: y }] }]}>
      <Text style={styles.emoji}>{reaction.emoji}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {reaction.playerName}
      </Text>
    </Animated.View>
  );
}

export function FloatingReactions({ reactions }: Props) {
  const recent = reactions.slice(-6);
  if (!recent.length) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      {recent.map((r) => (
        <Floater key={r.id} reaction={r} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: spacing.md,
    bottom: 120,
    gap: spacing.xs,
    zIndex: 15,
    alignItems: 'flex-end',
  },
  floater: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 11, 22, 0.85)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  emoji: {
    fontSize: 20,
  },
  name: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    maxWidth: 72,
  },
});
