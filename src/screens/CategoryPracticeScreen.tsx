import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useProfile } from '../context/ProfileContext';
import { CATEGORY_LIST, CATEGORY_WEDGES } from '../lib/categoryTheme';
import { canPracticeToday, consumePracticePlay } from '../lib/categoryStats';
import { allowedDifficulties, isDifficultyLocked, practiceLimit } from '../lib/entitlements';
import { getWedgeProgress } from '../lib/wedges';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';
import type { BotDifficulty, Category } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryPractice'>;

export function CategoryPracticeScreen({navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { profile, update, showProPaywall } = useProfile();
  const [category, setCategory] = useState<Category>(route.params?.category ?? 'Science');
  const [difficulty, setDifficulty] = useState<BotDifficulty>('easy');

  if (!profile) return null;

  const limit = practiceLimit(profile.isPro);
  const canPlay = canPracticeToday(profile, limit);
  const prog = getWedgeProgress(profile, category);
  const start = async () => {
    if (!canPlay) {
      const ok = await showProPaywall();
      if (!ok) Alert.alert('Daily limit', `Free players get ${limit} practice runs per day. Unlock everything for unlimited.`);
      return;
    }
    await update({ stats: consumePracticePlay(profile) });
    navigation.navigate('Game', {
      mode: 'practice',
      category,
      botDifficulty: difficulty,
      questionSeed: Date.now(),
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Category practice</Text>
        <Text style={styles.sub}>Grind one category toward your wedge</Text>

        <View style={styles.grid}>
          {CATEGORY_LIST.map((cat) => {
            const t = CATEGORY_WEDGES[cat];
            const active = cat === category;
            return (
              <Pressable
                key={cat}
                style={[styles.chip, active && { borderColor: t.fill, backgroundColor: `${t.fill}22` }]}
                onPress={() => setCategory(cat)}
              >
                <Text>{t.icon}</Text>
                <Text style={styles.chipLabel}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.progress}>
          {prog.earned ? '✓ Wedge earned' : `${prog.current}/${prog.target} correct`}
          {!profile.isPro && ` · ${limit - (profile.stats.practiceCountToday ?? 0)} plays left today`}
        </Text>

        <Text style={styles.section}>Bot difficulty</Text>
        <View style={styles.row}>
          {(['easy', 'medium', 'hard'] as BotDifficulty[]).map((d) => {
            const locked = isDifficultyLocked(d, profile.isPro);
            return (
              <Pressable
                key={d}
                style={[styles.diff, difficulty === d && styles.diffOn, locked && styles.diffLock]}
                onPress={() => {
                  if (locked) void showProPaywall();
                  else setDifficulty(d);
                }}
              >
                <Text style={styles.diffText}>{d}{locked ? ' 🔒' : ''}</Text>
              </Pressable>
            );
          })}
        </View>
        {!profile.isPro && (
          <Text style={styles.hint}>Medium & Hard — Unlock everything</Text>
        )}

        <PrimaryButton label="Start practice" onPress={() => void start()} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: font.h2, fontWeight: '900' },
  sub: { color: colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    width: '30%',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  chipLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', marginTop: 4 },
  progress: { color: colors.gold, fontWeight: '800', textAlign: 'center' },
  section: { color: colors.textMuted, fontWeight: '800', fontSize: font.small },
  row: { flexDirection: 'row', gap: spacing.sm },
  diff: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  diffOn: { borderWidth: 1, borderColor: colors.primary },
  diffLock: { opacity: 0.5 },
  diffText: { color: colors.text, fontWeight: '700', textTransform: 'capitalize' },
  hint: { color: colors.textFaint, fontSize: font.small, textAlign: 'center' },
  });
}
