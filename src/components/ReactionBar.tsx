import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { REACTION_EMOJIS, type ReactionEmoji } from '../lib/reactions';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  onReact: (emoji: ReactionEmoji) => void;
  disabled?: boolean;
}

export function ReactionBar({ onReact, disabled }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>React</Text>
      <View style={styles.row}>
        {REACTION_EMOJIS.map((emoji) => (
          <Pressable
            key={emoji}
            disabled={disabled}
            onPress={() => onReact(emoji)}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  label: {
    color: colors.textFaint,
    fontSize: font.small,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  btn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
  },
  btnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
  emoji: {
    fontSize: 22,
  },
});
