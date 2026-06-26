import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '../context/ProfileContext';
import { isVoiceProLocked } from '../lib/monetization';
import { isAiVoiceAvailable } from '../lib/aiTts';
import { speakLine } from '../lib/speech';
import {
  listFreeVoicePacks,
  listPremiumVoicePacks,
  PREMIUM_VOICE_COUNT,
  type VoicePackDef,
} from '../lib/voiceCatalog';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'VoicePacks'>;

export function VoicePacksScreen(_props: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { profile, setVoicePreset, showProPaywall } = useProfile();
  const [query, setQuery] = useState('');

  const free = listFreeVoicePacks();
  const premium = listPremiumVoicePacks();

  const filteredPremium = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return premium;
    return premium.filter(
      (p) => p.label.toLowerCase().includes(q) || p.hint.toLowerCase().includes(q)
    );
  }, [premium, query]);

  if (!profile) return null;

  const select = async (pack: VoicePackDef) => {
    if (isVoiceProLocked(pack.id, profile.isPro)) {
      await showProPaywall();
      return;
    }
    await setVoicePreset(pack.id);
  };

  const preview = (pack: VoicePackDef) => {
    if (isVoiceProLocked(pack.id, profile.isPro)) return;
    void speakLine('Survey says! Here is your trivia question.', {
      preset: pack.id,
      enabled: true,
    });
  };

  const renderPack = (item: VoicePackDef) => {
    const active = profile.voicePreset === item.id;
    const locked = isVoiceProLocked(item.id, profile.isPro);
    return (
      <Pressable
        style={[styles.row, active && styles.rowActive, locked && styles.rowLocked]}
        onPress={() => void select(item)}
      >
        <View style={styles.rowBody}>
          <Text style={[styles.label, active && styles.labelActive]}>
            {item.label}
            {locked ? ' 🔒' : ''}
          </Text>
          <Text style={styles.hint}>{item.hint}</Text>
        </View>
        {!locked && (
          <Pressable style={styles.preview} onPress={() => preview(item)}>
            <Text style={styles.previewText}>▶</Text>
          </Pressable>
        )}
      </Pressable>
    );
  };

  const header = (
    <View>
      <Text style={styles.title}>AI voice packs</Text>
      <Text style={styles.sub}>
        {free.length} free · {PREMIUM_VOICE_COUNT} premium with Unlock everything
      </Text>
      <Text style={styles.neural}>
        {isAiVoiceAvailable()
          ? '🎙 Neural AI voices on — cloud TTS with offline cache'
          : '📱 Device voices — enable neural AI in Supabase (see .env.example)'}
      </Text>
      <Text style={styles.section}>Free voices</Text>
      {free.map((p) => (
        <View key={p.id}>{renderPack(p)}</View>
      ))}
      <Text style={styles.section}>Premium voices ({PREMIUM_VOICE_COUNT})</Text>
      <TextInput
        style={styles.search}
        placeholder="Search premium voices…"
        placeholderTextColor={colors.textFaint}
        value={query}
        onChangeText={setQuery}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={filteredPremium}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => renderPack(item)}
        contentContainerStyle={styles.list}
        initialNumToRender={28}
        windowSize={10}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.gold, fontSize: font.h2, fontWeight: '900', paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  sub: { color: colors.textMuted, paddingHorizontal: spacing.lg },
  neural: {
    color: colors.textMuted,
    fontSize: font.small,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  section: {
    color: colors.textFaint,
    fontSize: font.small,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  search: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    color: colors.text,
    padding: spacing.md,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  list: { gap: spacing.xs, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.card,
    marginBottom: spacing.xs,
  },
  rowActive: { borderColor: colors.gold, backgroundColor: colors.bgElevated },
  rowLocked: { opacity: 0.72 },
  rowBody: { flex: 1 },
  label: { color: colors.text, fontWeight: '700', fontSize: font.body },
  labelActive: { color: colors.gold },
  hint: { color: colors.textFaint, fontSize: font.small, marginTop: 2 },
  preview: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: { color: colors.text, fontSize: 14 },
  });
}
