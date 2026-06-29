import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { getCategoryTheme } from '../lib/categoryTheme';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';
import type { MatchSummary, RoundResult } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchReplay'>;

const FUN_FACTS: Record<string, string[]> = {
  General: ['The average person knows about 42,000 words.', 'The shortest war lasted 38 minutes.'],
  Science: ['Hot water freezes faster than cold water (Mpemba effect).', 'Bananas are berries, but strawberries are not.'],
  History: ['Cleopatra lived closer to the Moon landing than to the building of the pyramids.', 'Oxford University is older than the Aztec Empire.'],
  Geography: ['Russia spans 11 time zones.', 'Africa is larger than the USA, China, and India combined.'],
  Sports: ['The Olympics used to award olive wreaths.', 'A cricket match can last up to 5 days.'],
  Music: ['The longest song is over 23 hours long.', 'Beethoven could still compose while completely deaf.'],
  Movies: ['The Lion King budget was higher than the entire GDP of some countries.', 'Avatar was the first film to gross $2 billion.'],
  Technology: ['The first computer bug was an actual insect.', 'The first iPhone had a 2MP camera.'],
  Nature: ['Octopuses have 3 hearts.', 'A group of flamingos is called a "flamboyance".'],
  Space: ['A day on Venus is longer than a year on Venus.', 'There are more stars than grains of sand on Earth.'],
  Food: ['Honey never spoils.', 'Apples float because they are 25% air.'],
  Animals: ['Cows have best friends.', 'A shrimp heart is in its head.'],
  'Pop Culture': ['The first YouTube video was uploaded April 23, 2005.', 'Minecraft is the best-selling game of all time.'],
  Literature: ['Shakespeare invented over 1,700 words.', 'Dracula has been adapted into more films than any other book.'],
  Art: ['The Mona Lisa has no visible eyebrows.', 'Picasso could draw before he could walk.'],
  Mythology: ['Zeus had over 90 children.', 'Norse mythology has 9 worlds connected by Yggdrasil.'],
  Politics: ['The youngest US president was 42.', 'Ancient Athens had a voting system called ostracism.'],
};

function getFact(category: string): string {
  const facts = FUN_FACTS[category];
  if (!facts) return 'Trivia is fun!';
  return facts[Math.floor(Math.random() * facts.length)];
}

export function MatchReplayScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { summary } = route.params;

  const outcomeEmoji = summary.outcome === 'win' ? '🏆' : summary.outcome === 'draw' ? '🤝' : '😔';
  const outcomeText = summary.outcome === 'win' ? 'Victory!' : summary.outcome === 'draw' ? 'Draw' : 'Defeat';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.outcomeEmoji}>{outcomeEmoji}</Text>
          <Text style={styles.outcomeText}>{outcomeText}</Text>
          <Text style={styles.score}>{summary.you} — {summary.opponent}</Text>
          <Text style={styles.vs}>vs {summary.opponentName}</Text>
        </View>

        <Text style={styles.sectionTitle}>Round-by-Round</Text>
        {summary.rounds.map((round, i) => (
          <RoundCard key={i} round={round} index={i} colors={colors} />
        ))}

        <Text style={styles.sectionTitle}>Fun Facts</Text>
        <View style={styles.factsCard}>
          {summary.rounds.slice(0, 3).map((round, i) => (
            <View key={i} style={styles.factRow}>
              <Text style={styles.factEmoji}>💡</Text>
              <Text style={styles.factText}>{getFact('General')}</Text>
            </View>
          ))}
        </View>

        <PrimaryButton label="Back to Home" variant="ghost" onPress={() => navigation.navigate('Home')} />
      </ScrollView>
    </SafeAreaView>
  );
}

function RoundCard({ round, index, colors }: { round: RoundResult; index: number; colors: ThemeColors }) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.roundCard, round.correct && styles.roundCardCorrect]}>
      <View style={styles.roundHeader}>
        <Text style={styles.roundNum}>Q{index + 1}</Text>
        <Text style={[styles.roundResult, { color: round.correct ? colors.success : colors.danger }]}>
          {round.correct ? '✓ Correct' : '✕ Wrong'}
        </Text>
        <Text style={styles.roundTime}>{(round.ms / 1000).toFixed(1)}s</Text>
      </View>
      <Text style={styles.roundPoints}>+{round.points} pts</Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    header: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    outcomeEmoji: { fontSize: 48 },
    outcomeText: { color: colors.text, fontSize: font.h1, fontWeight: '900' },
    score: { color: colors.gold, fontSize: font.h2, fontWeight: '900' },
    vs: { color: colors.textMuted, fontSize: font.body },
    sectionTitle: { color: colors.text, fontSize: font.h3, fontWeight: '900', marginTop: spacing.sm },
    roundCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
      gap: spacing.xs,
    },
    roundCardCorrect: { borderColor: colors.success },
    roundHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    roundNum: { color: colors.primary, fontSize: font.small, fontWeight: '900', width: 28 },
    roundResult: { flex: 1, fontSize: font.body, fontWeight: '800' },
    roundTime: { color: colors.textMuted, fontSize: font.small, fontWeight: '700' },
    roundPoints: { color: colors.gold, fontSize: font.small, fontWeight: '900' },
    factsCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
      gap: spacing.md,
    },
    factRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
    factEmoji: { fontSize: 16 },
    factText: { flex: 1, color: colors.textMuted, fontSize: font.small, lineHeight: 20 },
  });
}
