import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useProfile } from '../context/ProfileContext';
import { canCreateUgc } from '../lib/entitlements';
import { countUgcPacks, loadUgcPacks, packQuestionSeed, submitUgcPack } from '../lib/ugc';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';
import type { UgcPack } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'UgcPacks'>;

export function UgcPacksScreen({navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { profile, showProPaywall } = useProfile();
  const [packs, setPacks] = useState<UgcPack[]>([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!profile) return;
    void loadUgcPacks(profile.isPro).then(setPacks);
  }, [profile?.isPro]);

  if (!profile) return null;

  const counts = countUgcPacks(profile.isPro);
  const freePacks = packs.filter((p) => p.tier !== 'pro');
  const proPacks = packs.filter((p) => p.tier === 'pro');

  const playPack = (p: UgcPack) => {
    if (p.tier === 'pro' && !profile.isPro) {
      void showProPaywall();
      return;
    }
    if (p.questionIds.length < 1) {
      Alert.alert('Empty pack', 'This pack has no questions yet.');
      return;
    }
    navigation.navigate('Game', {
      mode: 'solo',
      questionIds: p.questionIds,
      questionSeed: packQuestionSeed(p.id),
      category: p.category,
      ugcPackId: p.id,
      ugcPackTitle: p.title,
    });
  };

  const create = async () => {
    if (!canCreateUgc(profile.isPro)) {
      const ok = await showProPaywall();
      if (!ok) Alert.alert('Pro feature', 'Creating packs requires Unlock everything.');
      return;
    }
    if (!title.trim()) return;
    await submitUgcPack(title.trim(), profile.username, 'General', []);
    Alert.alert('Submitted', 'Your pack is pending moderation.');
    setTitle('');
  };

  const PackCard = ({ p, locked }: { p: UgcPack; locked?: boolean }) => (
    <Pressable key={p.id} style={styles.card} onPress={() => playPack(p)}>
      <View style={styles.cardBody}>
        <Text style={styles.packTitle}>
          {p.title}
          {locked ? ' 🔒' : ''}
        </Text>
        <Text style={styles.packMeta}>
          {p.category} · by {p.author} · {p.questionIds.length} Qs
        </Text>
      </View>
      <Text style={styles.play}>{locked ? 'Pro' : 'Play ▶'}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Community packs</Text>
        <Text style={styles.sub}>
          {counts.free} free packs · {counts.pro} premium packs
          {profile.isPro ? ' · all unlocked' : ''}
        </Text>

        <Text style={styles.section}>Free packs ({freePacks.length})</Text>
        {freePacks.map((p) => (
          <PackCard key={p.id} p={p} />
        ))}

        <Text style={styles.section}>
          Premium packs ({proPacks.length}) {!profile.isPro ? '🔒' : ''}
        </Text>
        {proPacks.map((p) => (
          <PackCard key={p.id} p={p} locked={!profile.isPro} />
        ))}

        <View style={styles.create}>
          <Text style={styles.createLabel}>Create pack 🔒 Pro</Text>
          <TextInput
            style={styles.input}
            placeholder="Pack title"
            placeholderTextColor={colors.textFaint}
            value={title}
            onChangeText={setTitle}
          />
          <PrimaryButton label="Submit for review" onPress={() => void create()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.sm },
  title: { color: colors.text, fontSize: font.h2, fontWeight: '900' },
  sub: { color: colors.textMuted, marginBottom: spacing.md },
  section: {
    color: colors.gold,
    fontWeight: '800',
    fontSize: font.small,
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  cardBody: { flex: 1 },
  play: { color: colors.primary, fontWeight: '900', fontSize: font.small },
  packTitle: { color: colors.text, fontWeight: '800' },
  packMeta: { color: colors.textFaint, fontSize: font.small },
  create: { marginTop: spacing.lg, gap: spacing.sm },
  createLabel: { color: colors.gold, fontWeight: '800' },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    color: colors.text,
    padding: spacing.md,
  },
  });
}
