import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { pickMatchQuestions } from '../data/questions';
import { getCategoryTheme } from '../lib/categoryTheme';
import { getRecentQuestionIds } from '../lib/questionHistory';
import { canUsePictureRounds, canUseRankedMatch } from '../lib/entitlements';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';
import type { Category, Question } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveHost'>;

interface Player {
  id: string;
  name: string;
  score: number;
  streak: number;
  answered: boolean;
}

const DEMO_PLAYERS: Player[] = [
  { id: 'p1', name: 'You', score: 0, streak: 0, answered: false },
  { id: 'p2', name: 'Alex', score: 0, streak: 0, answered: false },
  { id: 'p3', name: 'Sam', score: 0, streak: 0, answered: false },
  { id: 'p4', name: 'Jordan', score: 0, streak: 0, answered: false },
];

export function LiveHostScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [phase, setPhase] = useState<'lobby' | 'playing' | 'reveal' | 'done'>('lobby');
  const [players, setPlayers] = useState<Player[]>(DEMO_PLAYERS);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [hostLine, setHostLine] = useState('Waiting for players…');
  const [timer, setTimer] = useState(10);

  const questions = useMemo<Question[]>(() => {
    return pickMatchQuestions(10, Date.now(), {
      isPro: profile?.isPro ?? false,
      recentIds: getRecentQuestionIds(profile?.stats),
    });
  }, [profile]);

  const q = questions[questionIndex];

  useEffect(() => {
    if (phase !== 'playing') return;
    setHostLine(`Question ${questionIndex + 1} of ${questions.length}`);
    setRevealed(false);
    setSelected(null);
    setLocked(false);
    setTimer(10);
    setPlayers((prev) => prev.map((p) => ({ ...p, answered: false })));

    const tick = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(tick);
          handleReveal();
          return 0;
        }
        // Simulate bots answering
        setPlayers((prev) =>
          prev.map((p) =>
            !p.answered && p.id !== 'p1' && Math.random() > 0.4
              ? { ...p, answered: true }
              : p
          )
        );
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [phase, questionIndex]);

  const startGame = () => {
    if (!canUseRankedMatch(profile?.isPro ?? false)) {
      Alert.alert('Pro only', 'Live Host mode requires Pro.');
      return;
    }
    setPhase('playing');
    setPlayers(DEMO_PLAYERS.map((p) => ({ ...p, score: 0, streak: 0 })));
    setQuestionIndex(0);
  };

  const handleSelect = (i: number) => {
    if (locked) return;
    setSelected(i);
    setLocked(true);
    setPlayers((prev) =>
      prev.map((p) => (p.id === 'p1' ? { ...p, answered: true } : p))
    );
  };

  const handleReveal = () => {
    setRevealed(true);
    setPhase('reveal');

    const isCorrect = selected === q?.answer;
    setHostLine(isCorrect ? 'That is CORRECT!' : 'Ooh, not quite!');

    // Score players who answered correctly
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === 'p1' && isCorrect) {
          return { ...p, score: p.score + 100, streak: p.streak + 1 };
        }
        if (p.id !== 'p1' && p.answered && Math.random() > 0.4) {
          return { ...p, score: p.score + 100, streak: p.streak + 1 };
        }
        return { ...p, streak: 0 };
      })
    );
  };

  const handleNext = () => {
    if (questionIndex + 1 >= questions.length) {
      setPhase('done');
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      setHostLine(`${winner.name} wins with ${winner.score} points!`);
    } else {
      setQuestionIndex((i) => i + 1);
      setPhase('playing');
    }
  };

  if (phase === 'lobby') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Live Host</Text>
          <Text style={styles.subtitle}>Host a live trivia game for friends in the same room</Text>

          <View style={styles.lobbyCard}>
            <Text style={styles.lobbyEmoji}>🎙</Text>
            <Text style={styles.lobbyTitle}>How it works</Text>
            <Text style={styles.lobbyDesc}>
              Read questions aloud while players answer on their phones. 
              The host screen shows the question, and players compete in real-time.
            </Text>
            <View style={styles.playerList}>
              {players.map((p) => (
                <View key={p.id} style={styles.playerRow}>
                  <Text style={styles.playerEmoji}>👤</Text>
                  <Text style={styles.playerName}>{p.name}</Text>
                  <Text style={styles.playerStatus}>Ready</Text>
                </View>
              ))}
            </View>
          </View>

          <PrimaryButton label="Start Game" variant="accent" onPress={startGame} />
          <PrimaryButton label="Back to Home" variant="ghost" onPress={() => navigation.navigate('Home')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phase === 'done') {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Game Over!</Text>
          <Text style={styles.subtitle}>{hostLine}</Text>
          {sorted.map((p, i) => (
            <View key={p.id} style={[styles.resultRow, i === 0 && styles.resultRowWinner]}>
              <Text style={styles.resultRank}>#{i + 1}</Text>
              <Text style={styles.resultName}>{p.name}</Text>
              <Text style={styles.resultScore}>{p.score}</Text>
            </View>
          ))}
          <PrimaryButton label="Play Again" variant="primary" onPress={startGame} />
          <PrimaryButton label="Back to Home" variant="ghost" onPress={() => navigation.navigate('Home')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const catTheme = q ? getCategoryTheme(q.category) : null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hostBanner}>
          <Text style={styles.hostEmoji}>🎙</Text>
          <View>
            <Text style={styles.hostTitle}>HOST VIEW</Text>
            <Text style={styles.hostLine}>{hostLine}</Text>
          </View>
        </View>

        <View style={styles.scoreboard}>
          {players.map((p) => (
            <View key={p.id} style={[styles.scorePill, p.answered && styles.scorePillAnswered]}>
              <Text style={styles.scorePillName}>{p.name}</Text>
              <Text style={styles.scorePillScore}>{p.score}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.timerBar, { backgroundColor: timer <= 3 ? colors.danger : colors.primary }]}>
          <Text style={styles.timerText}>{timer}s</Text>
        </View>

        {q && (
          <View style={[styles.questionCard, { borderLeftColor: catTheme?.fill ?? colors.primary }]}>
            <Text style={styles.qCategory}>{catTheme?.icon} {q.category}</Text>
            <Text style={styles.qPrompt}>{q.prompt}</Text>
            {q.imageUrl && <Text style={styles.qHint}>Image: {q.imageUrl}</Text>}
          </View>
        )}

        {q && phase === 'playing' && (
          <View style={styles.options}>
            {q.options.map((opt, i) => (
              <Pressable
                key={i}
                style={[
                  styles.option,
                  { borderColor: catTheme?.fill ?? colors.primary },
                  selected === i && styles.optionSelected,
                ]}
                onPress={() => handleSelect(i)}
                disabled={locked}
              >
                <Text style={styles.optionLetter}>{String.fromCharCode(65 + i)}</Text>
                <Text style={styles.optionText}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {revealed && q && (
          <View style={styles.revealSection}>
            <Text style={[styles.revealCorrect, { color: colors.success }]}>
              Correct: {q.options[q.answer]}
            </Text>
            <PrimaryButton label="Next Question" variant="primary" onPress={handleNext} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    title: { color: colors.gold, fontSize: font.h2, fontWeight: '900', textAlign: 'center' },
    subtitle: { color: colors.textMuted, fontSize: font.body, textAlign: 'center' },
    lobbyCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
    },
    lobbyEmoji: { fontSize: 48 },
    lobbyTitle: { color: colors.text, fontSize: font.h3, fontWeight: '900' },
    lobbyDesc: { color: colors.textMuted, fontSize: font.small, textAlign: 'center' },
    playerList: { width: '100%', gap: spacing.sm, marginTop: spacing.sm },
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bgElevated,
      borderRadius: radius.sm,
      padding: spacing.sm,
    },
    playerEmoji: { fontSize: 18 },
    playerName: { flex: 1, color: colors.text, fontWeight: '700' },
    playerStatus: { color: colors.success, fontSize: font.small, fontWeight: '700' },
    hostBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.gold,
      padding: spacing.md,
    },
    hostEmoji: { fontSize: 36 },
    hostTitle: { color: colors.gold, fontSize: font.small, fontWeight: '900', letterSpacing: 2 },
    hostLine: { color: colors.text, fontSize: font.body, fontWeight: '700' },
    scoreboard: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    scorePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    scorePillAnswered: { borderColor: colors.success },
    scorePillName: { color: colors.textMuted, fontSize: font.small, fontWeight: '700' },
    scorePillScore: { color: colors.gold, fontSize: font.body, fontWeight: '900' },
    timerBar: {
      borderRadius: radius.pill,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    timerText: { color: colors.text, fontSize: font.h3, fontWeight: '900' },
    questionCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderLeftWidth: 4,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    qCategory: { color: colors.primary, fontSize: font.small, fontWeight: '900', textTransform: 'uppercase' },
    qPrompt: { color: colors.text, fontSize: font.h3, fontWeight: '800', lineHeight: 28 },
    qHint: { color: colors.textFaint, fontSize: font.small, fontStyle: 'italic' },
    options: { gap: spacing.sm },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 2,
      padding: spacing.md,
      gap: spacing.md,
    },
    optionSelected: { backgroundColor: colors.bgElevated, borderColor: colors.gold },
    optionLetter: { color: colors.gold, fontSize: font.body, fontWeight: '900', width: 24 },
    optionText: { flex: 1, color: colors.text, fontSize: font.body, fontWeight: '700' },
    revealSection: { gap: spacing.md, alignItems: 'center' },
    revealCorrect: { fontSize: font.h3, fontWeight: '900', textAlign: 'center' },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: spacing.md,
    },
    resultRowWinner: { borderColor: colors.gold, borderWidth: 2 },
    resultRank: { color: colors.textMuted, fontSize: font.body, fontWeight: '900', width: 32 },
    resultName: { flex: 1, color: colors.text, fontSize: font.body, fontWeight: '800' },
    resultScore: { color: colors.gold, fontSize: font.h3, fontWeight: '900' },
  });
}
