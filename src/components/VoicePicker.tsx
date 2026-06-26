import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isVoiceProLocked, PREMIUM_VOICE_COUNT } from '../lib/monetization';
import { speakLine } from '../lib/speech';
import { getVoicePack, listFreeVoicePacks } from '../lib/voiceCatalog';
import type { RootStackParamList } from '../navigation';
import type { VoicePreset } from '../types';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

interface Props {
  preset: VoicePreset;
  isPro: boolean;
  onPreset: (p: VoicePreset) => void;
  onPreview: (p: VoicePreset) => void;
  onRequestPro?: () => void;
}

export function VoicePicker({preset,
  isPro,
  onPreset,
  onPreview,
  onRequestPro,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const freePacks = listFreeVoicePacks();
  const activePack = getVoicePack(preset);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>🎙 Question voice</Text>
      <Text style={styles.active}>
        Active: <Text style={styles.activeName}>{activePack.label}</Text> · off by default
      </Text>

      {freePacks.map((pack) => {
        const active = preset === pack.id;
        const locked = isVoiceProLocked(pack.id, isPro);
        return (
          <Pressable
            key={pack.id}
            style={[styles.row, active && styles.rowActive, locked && styles.rowLocked]}
            onPress={() => {
              if (locked) {
                onRequestPro?.();
                return;
              }
              onPreset(pack.id);
            }}
            onLongPress={() => !locked && onPreview(pack.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, active && styles.labelActive]}>{pack.label}</Text>
              <Text style={styles.hint}>{pack.hint}</Text>
            </View>
            {!locked && (
              <Pressable
                style={styles.previewBtn}
                onPress={() => {
                  void speakLine('Here is your trivia question.', {
                    preset: pack.id,
                    enabled: true,
                  });
                }}
              >
                <Text style={styles.previewText}>▶</Text>
              </Pressable>
            )}
          </Pressable>
        );
      })}

      <Pressable
        style={styles.browse}
        onPress={() => navigation.navigate('VoicePacks')}
      >
        <Text style={styles.browseText}>
          Browse {PREMIUM_VOICE_COUNT}+ premium voices {isPro ? '✨' : '🔒 Pro'}
        </Text>
      </Pressable>

      <Text style={styles.note}>Tap ▶ to preview · voice stays off during play</Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  title: {
    color: colors.gold,
    fontSize: font.body,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  active: {
    color: colors.textMuted,
    fontSize: font.small,
    marginBottom: spacing.xs,
  },
  activeName: { color: colors.text, fontWeight: '800' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowActive: {
    borderColor: colors.gold,
    backgroundColor: colors.bgElevated,
  },
  rowLocked: { opacity: 0.75 },
  label: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '700',
  },
  labelActive: { color: colors.gold },
  hint: {
    color: colors.textFaint,
    fontSize: font.small,
    marginTop: 2,
  },
  previewBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: { color: colors.text, fontSize: 14 },
  browse: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  browseText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: font.small,
  },
  note: {
    color: colors.textFaint,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  });
}
