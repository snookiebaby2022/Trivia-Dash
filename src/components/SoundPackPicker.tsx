import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { getCurrentSoundPack, SOUND_PACKS, setSoundPack, type SoundPackId } from '../lib/soundPacks';
import { font, radius, spacing } from '../theme';
import type { ThemeColors } from '../theme';

interface Props {
  onChange?: (pack: SoundPackId) => void;
}

export function SoundPackPicker({ onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const current = getCurrentSoundPack();

  const handleSelect = (id: SoundPackId) => {
    void setSoundPack(id);
    onChange?.(id);
  };

  return (
    <View style={styles.container}>
      {SOUND_PACKS.map((pack) => (
        <Pressable
          key={pack.id}
          style={[styles.pill, current === pack.id && styles.pillActive]}
          onPress={() => handleSelect(pack.id)}
        >
          <Text style={styles.emoji}>{pack.emoji}</Text>
          <View style={styles.pillBody}>
            <Text style={[styles.label, current === pack.id && styles.labelActive]}>{pack.label}</Text>
            <Text style={styles.desc}>{pack.description}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { gap: spacing.sm },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
    },
    pillActive: { borderColor: colors.gold, backgroundColor: colors.bgElevated },
    emoji: { fontSize: 24 },
    pillBody: { flex: 1 },
    label: { color: colors.textMuted, fontSize: font.body, fontWeight: '900' },
    labelActive: { color: colors.gold },
    desc: { color: colors.textFaint, fontSize: font.small, marginTop: 2 },
  });
}
