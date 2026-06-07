import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useProfile } from '../context/ProfileContext';
import {
  BOT_DIFFICULTY_HINTS,
  BOT_DIFFICULTY_LABELS,
  BOT_DIFFICULTY_ORDER,
} from '../lib/botDifficulty';
import { isMatchmakingAvailable } from '../lib/matchmaking';
import { buildOfflineQuad } from '../lib/quad';
import type { RootStackParamList } from '../navigation';
import { colors, font, radius, spacing } from '../theme';
import type { BotDifficulty } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'QuadSetup'>;

export function QuadSetupScreen({ navigation }: Props) {
  const { profile } = useProfile();
  const [online, setOnline] = useState(false);
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');

  if (!profile) return null;

  const startOffline = () => {
    const competitors = buildOfflineQuad(profile, difficulty);
    navigation.navigate('QuadGame', {
      competitors,
      questionSeed: Math.floor(Math.random() * 1e9),
      botDifficulty: difficulty,
      isOnline: false,
    });
  };

  const startOnline = () => {
    navigation.navigate('PartyLobby', {
      host: true,
      quad: true,
      botDifficulty: difficulty,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>4-Player Trivia 🎲</Text>
        <Text style={styles.sub}>You + 3 opponents. Highest score wins.</Text>

        <Text style={styles.section}>Mode</Text>
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggle, !online && styles.toggleActive]}
            onPress={() => setOnline(false)}
          >
            <Text style={[styles.toggleText, !online && styles.toggleTextActive]}>Offline</Text>
            <Text style={styles.toggleHint}>3 bots on this device</Text>
          </Pressable>
          <Pressable
            style={[styles.toggle, online && styles.toggleActive]}
            onPress={() => setOnline(true)}
          >
            <Text style={[styles.toggleText, online && styles.toggleTextActive]}>Online</Text>
            <Text style={styles.toggleHint}>Up to 4 humans + bot fill</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Bot difficulty</Text>
        <Text style={styles.sectionHint}>
          {online
            ? 'Bots fill empty seats when the room starts'
            : 'All 3 opponents use this level'}
        </Text>

        {BOT_DIFFICULTY_ORDER.map((level) => (
          <Pressable
            key={level}
            style={[styles.levelRow, difficulty === level && styles.levelActive]}
            onPress={() => setDifficulty(level)}
          >
            <Text style={[styles.levelLabel, difficulty === level && styles.levelLabelActive]}>
              {BOT_DIFFICULTY_LABELS[level]}
            </Text>
            <Text style={styles.levelHint}>{BOT_DIFFICULTY_HINTS[level]}</Text>
          </Pressable>
        ))}

        <View style={styles.actions}>
          <PrimaryButton
            label={online ? 'Create 4-Player Room' : 'Start Offline Match'}
            variant="accent"
            onPress={() => {
              if (online) {
                if (!isMatchmakingAvailable()) {
                  startOffline();
                  return;
                }
                startOnline();
              } else {
                startOffline();
              }
            }}
          />
          {!isMatchmakingAvailable() && online && (
            <Text style={styles.note}>Supabase not configured — starting offline instead.</Text>
          )}
          <PrimaryButton label="Back" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    color: colors.text,
    fontSize: font.h1,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  sub: {
    color: colors.textMuted,
    fontSize: font.body,
    marginBottom: spacing.lg,
  },
  section: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '800',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionHint: {
    color: colors.textFaint,
    fontSize: font.small,
    marginBottom: spacing.sm,
  },
  toggleRow: { flexDirection: 'row', gap: spacing.sm },
  toggle: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  toggleActive: { borderColor: colors.primary, backgroundColor: colors.bgElevated },
  toggleText: {
    color: colors.textMuted,
    fontSize: font.h3,
    fontWeight: '800',
  },
  toggleTextActive: { color: colors.primary },
  toggleHint: {
    color: colors.textFaint,
    fontSize: font.small,
    marginTop: 4,
  },
  levelRow: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  levelActive: { borderColor: colors.accent, backgroundColor: colors.bgElevated },
  levelLabel: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '800',
  },
  levelLabelActive: { color: colors.accent },
  levelHint: {
    color: colors.textMuted,
    fontSize: font.small,
    marginTop: 2,
  },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  note: {
    color: colors.warning,
    fontSize: font.small,
    textAlign: 'center',
  },
});
