import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '../context/ProfileContext';
import {
  ACHIEVEMENTS,
  getAchievementProgress,
  isAchievementUnlocked,
} from '../lib/achievements';
import type { RootStackParamList } from '../navigation';
import { colors, font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Achievements'>;

export function AchievementWallScreen({}: Props) {
  const { profile } = useProfile();
  if (!profile) return null;

  const unlockedCount = profile.achievementState.unlocked.length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>Trophy Case</Text>
        <Text style={styles.sub}>
          {unlockedCount}/{ACHIEVEMENTS.length} unlocked · cosmetics carry over to your avatar
        </Text>

        {ACHIEVEMENTS.map((def) => {
          const done = isAchievementUnlocked(def.id, profile);
          const progress = getAchievementProgress(def, profile);
          const pct = Math.min(1, progress / def.target);

          return (
            <View key={def.id} style={[styles.card, done && styles.cardDone]}>
              <Text style={styles.emoji}>{def.emoji}</Text>
              <View style={styles.body}>
                <Text style={styles.label}>{def.label}</Text>
                <Text style={styles.desc}>{def.description}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct * 100}%` }, done && styles.fillDone]} />
                </View>
                <Text style={styles.progress}>
                  {done ? 'Unlocked!' : `${Math.min(progress, def.target)}/${def.target}`}
                  {def.reward?.frame ? ` · ${def.reward.frame} frame` : ''}
                  {def.reward?.badge ? ` · ${def.reward.badge} badge` : ''}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  headline: {
    color: colors.gold,
    fontSize: font.h1,
    fontWeight: '900',
    textAlign: 'center',
  },
  sub: {
    color: colors.textMuted,
    fontSize: font.body,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  cardDone: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(255, 210, 77, 0.08)',
  },
  emoji: {
    fontSize: 32,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: '900',
  },
  desc: {
    color: colors.textMuted,
    fontSize: font.small,
  },
  track: {
    height: 6,
    backgroundColor: colors.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  fillDone: {
    backgroundColor: colors.gold,
  },
  progress: {
    color: colors.textFaint,
    fontSize: font.small,
    fontWeight: '700',
    marginTop: 2,
  },
});
