import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isVoiceProLocked, PRO_VOICE_PRESETS } from '../lib/monetization';
import { VOICE_ORDER, VOICE_PRESETS } from '../lib/speech';
import type { VoicePreset } from '../types';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  preset: VoicePreset;
  enabled: boolean;
  isPro: boolean;
  onPreset: (p: VoicePreset) => void;
  onToggle: (enabled: boolean) => void;
  onPreview: (p: VoicePreset) => void;
  onRequestPro?: () => void;
}

export function VoicePicker({
  preset,
  enabled,
  isPro,
  onPreset,
  onToggle,
  onPreview,
  onRequestPro,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>🎙 Question voice</Text>
        <Pressable
          style={[styles.toggle, enabled && styles.toggleOn]}
          onPress={() => onToggle(!enabled)}
        >
          <Text style={styles.toggleText}>{enabled ? 'ON' : 'OFF'}</Text>
        </Pressable>
      </View>

      {VOICE_ORDER.map((id) => {
        const v = VOICE_PRESETS[id];
        const active = preset === id;
        const locked = isVoiceProLocked(id, isPro);
        return (
          <Pressable
            key={id}
            style={[styles.row, active && styles.rowActive, locked && styles.rowLocked]}
            onPress={() => {
              if (locked) {
                onRequestPro?.();
                return;
              }
              onPreset(id);
            }}
            onLongPress={() => !locked && onPreview(id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, active && styles.labelActive]}>
                {v.label}
                {locked ? ' 🔒 Pro' : ''}
              </Text>
              <Text style={styles.hint}>{v.hint}</Text>
            </View>
            {!locked && (
              <Pressable style={styles.previewBtn} onPress={() => onPreview(id)}>
                <Text style={styles.previewText}>▶</Text>
              </Pressable>
            )}
          </Pressable>
        );
      })}
      {!isPro && (
        <Text style={styles.proNote}>
          Pro unlocks {PRO_VOICE_PRESETS.map((p) => VOICE_PRESETS[p].label).join(', ')}
        </Text>
      )}
      <Text style={styles.note}>Tap to select · ▶ to preview</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.gold,
    fontSize: font.body,
    fontWeight: '800',
  },
  toggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
  },
  toggleOn: { backgroundColor: colors.success },
  toggleText: {
    color: colors.text,
    fontSize: font.small,
    fontWeight: '900',
  },
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
  proNote: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  note: {
    color: colors.textFaint,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
