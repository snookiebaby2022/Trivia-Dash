import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useProfile } from '../context/ProfileContext';
import {
  ensureSeasonPass,
  seasonLevel,
  seasonTiers,
  seasonXpProgress,
  WINS_PER_XP_GAIN,
  XP_LOSS_ON_DEFEAT,
  XP_PER_LEVEL,
} from '../lib/seasonPass';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SeasonPass'>;

export function SeasonPassScreen({}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { profile, showProPaywall } = useProfile();
  if (!profile) return null;

  const pass = ensureSeasonPass(profile.seasonPass);
  const level = seasonLevel(pass.xp);
  const prog = seasonXpProgress(pass.xp);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Season pass</Text>
        <Text style={styles.sub}>
          Level {level} / 100 · {pass.xp} XP · {pass.seasonId}
        </Text>
        <Text style={styles.rule}>
          {prog.xpInLevel} / {XP_PER_LEVEL} XP to next level · win {WINS_PER_XP_GAIN} for +{XP_PER_LEVEL}{' '}
          XP · lose −{XP_LOSS_ON_DEFEAT} XP · {pass.winsTowardXp ?? 0}/{WINS_PER_XP_GAIN} wins toward +XP
        </Text>

        {seasonTiers().map((tier) => {
          const unlocked = pass.xp >= tier.xpRequired;
          return (
            <View key={tier.level} style={[styles.tier, unlocked && styles.tierOn]}>
              <Text style={styles.lvl}>Lv {tier.level}</Text>
              <View style={styles.rewards}>
                <Text style={styles.free}>Free: {tier.freeReward ?? '—'}</Text>
                <Pressable
                  onPress={() => !profile.isPro && void showProPaywall()}
                  style={styles.proRow}
                >
                  <Text style={styles.pro}>
                    Pro: {tier.proReward ?? '—'}
                    {!profile.isPro ? ' 🔒' : ''}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {!profile.isPro && (
          <PrimaryButton label="Unlock everything — premium track" onPress={() => void showProPaywall()} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.sm },
  title: { color: colors.gold, fontSize: font.h2, fontWeight: '900', textAlign: 'center' },
  sub: { color: colors.textMuted, textAlign: 'center' },
  rule: {
    color: colors.textFaint,
    fontSize: font.small,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  tier: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tierOn: { borderColor: colors.primary },
  lvl: { color: colors.text, fontWeight: '900', marginBottom: 4 },
  rewards: { gap: 4 },
  free: { color: colors.textMuted, fontSize: font.small },
  proRow: {},
  pro: { color: colors.gold, fontSize: font.small, fontWeight: '700' },
  });
}
