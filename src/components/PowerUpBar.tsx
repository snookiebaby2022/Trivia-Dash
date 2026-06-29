import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import type { PowerUpInventory, PowerUpType } from '../types';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

const ITEMS: { type: PowerUpType; emoji: string; label: string }[] = [
  { type: 'fiftyFifty', emoji: '½', label: '50/50' },
  { type: 'extraTime', emoji: '⏱', label: '+5s' },
  { type: 'skip', emoji: '⏭', label: 'Skip' },
];

interface Props {
  inventory: PowerUpInventory;
  disabled?: boolean;
  onUse: (type: PowerUpType) => void;
}

export function PowerUpBar({ inventory, disabled, onUse }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {ITEMS.map((item) => {
        const count = inventory[item.type] ?? 0;
        const canUse = count > 0 && !disabled;
        return (
          <Pressable
            key={item.type}
            style={[styles.chip, canUse && styles.chipOn, !canUse && styles.chipOff]}
            onPress={() => canUse && onUse(item.type)}
            disabled={!canUse}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.count}>×{count}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
      justifyContent: 'center',
      marginVertical: spacing.sm,
    },
    chip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.bgElevated,
    },
    chipOn: { borderColor: colors.primary },
    chipOff: { opacity: 0.4 },
    emoji: { fontSize: 18 },
    label: { color: colors.textMuted, fontSize: 10, fontWeight: '800' },
    count: { color: colors.gold, fontSize: font.small, fontWeight: '900' },
  });
}
