import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarView } from '../components/AvatarView';
import { MatchCelebrationOverlay } from '../components/MatchCelebrationOverlay';
import { TriviaCard } from '../components/TriviaCard';
import { WedgeTracker } from '../components/WedgeTracker';
import { useProfile } from '../context/ProfileContext';
import { pickMatchQuestions } from '../data/questions';
import {
  announceCelebration,
  hapticSuccess,
  streakCelebration,
  wedgeCelebration,
  type CelebrationPayload,
} from '../lib/celebrations';
import { finalizeProfileAfterMatch } from '../lib/achievements';
import { getCategoryTheme } from '../lib/categoryTheme';
import { detectMilestones } from '../lib/milestones';
import { ROUND_TIME_MS, scoreAnswer } from '../lib/scoring';
import { speakQuestion, stopSpeaking } from '../lib/speech';
import type { RootStackParamList } from '../navigation';
import { colors, font, radius, spacing } from '../theme';
import type { Category, MatchSummary, PassPlayPlayer, RoundResult } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PassPlayGame'>;

type Phase = 'countdown' | 'playing';

export function PassPlayGameScreen({ navigation, route }: Props) {
  const { players: initialPlayers, questionSeed } = route.params;
  const { profile, update } = useProfile();

  const questions = useMemo(
    () => pickMatchQuestions(7, questionSeed, { isPro: profile?.isPro ?? false }),
    [questionSeed, profile?.isPro]
  );

  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState(0);
  const [players, setPlayers] = useState<PassPlayPlayer[]>(initialPlayers);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [collectedWedges, setCollectedWedges] = useState<Category[]>([]);
  const [celebration, setCelebration] = useState<CelebrationPayload | null>(null);

  const rounds = useRef<RoundResult[]>([]);
  const roundStart = useRef(0);
  const matchStreak = useRef(0);
  const progress = useRef(new Animated.Value(1)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const active = players[turn % players.length];

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setPhase('playing');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 700);
    timers.current.push(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== 'playing' || !profile) return;
    const q = questions[index];
    if (!q) return;
    void speakQuestion(q.prompt, {
      preset: profile.voicePreset,
      enabled: profile.voiceEnabled,
    });
  }, [phase, index, questions, profile]);

  const finishMatch = useCallback(() => {
    if (!profile) return;

    const sorted = [...players].sort((a, b) => b.score - a.score);
    const youRank = sorted.findIndex((p) => p.id === players[0].id) + 1;
    const hostWon = players[0].score === sorted[0].score && players[0].id === sorted[0].id;
    const outcome = hostWon ? 'win' : ('loss' as const);

    const standings = sorted.map((p, i) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      rank: i + 1,
      isYou: p.id === players[0].id,
      isBot: false,
    }));

    const summaryBase: MatchSummary = {
      you: players[0].score,
      opponent: sorted[0].score,
      opponentName: sorted[0].name,
      opponentAvatar: sorted[0].avatar,
      rounds: rounds.current,
      outcome: players[0].score === sorted[0].score ? 'draw' : outcome,
      eloDelta: 0,
      newElo: profile.elo,
      mode: 'passplay',
      isOnline: false,
      partyRank: sorted.findIndex((p) => p.id === players[0].id) + 1,
      partySize: players.length,
      standings,
      collectedWedges,
    };

    if (summaryBase.you > summaryBase.opponent) summaryBase.outcome = 'win';
    else if (summaryBase.you < summaryBase.opponent) summaryBase.outcome = 'loss';
    else summaryBase.outcome = 'draw';

    const cats = rounds.current
      .filter((r) => r.correct)
      .map((r) => questions.find((q) => q.id === r.questionId)?.category)
      .filter((c): c is Category => Boolean(c));

    const passPlayWin = summaryBase.outcome === 'win' || (summaryBase.partyRank === 1);
    const { profile: enriched, newlyUnlocked } = finalizeProfileAfterMatch(
      profile,
      {
        wins: profile.wins + (passPlayWin ? 1 : 0),
        losses: profile.losses + (summaryBase.partyRank === players.length && players.length > 1 ? 1 : 0),
        streak: passPlayWin ? profile.streak + 1 : 0,
        bestStreak: Math.max(profile.bestStreak, passPlayWin ? profile.streak + 1 : 0),
        achievementState: profile.achievementState,
        stats: profile.stats,
      },
      summaryBase,
      cats
    );

    void update({
      wins: enriched.wins,
      losses: enriched.losses,
      streak: enriched.streak,
      bestStreak: enriched.bestStreak,
      achievementState: enriched.achievementState,
      stats: enriched.stats,
    });

    const milestones = detectMilestones(profile, summaryBase, {
      wins: enriched.wins,
      streak: enriched.streak,
      dailyStreak: profile.dailyStreak,
      newElo: profile.elo,
    });

    const achievementUnlocks = newlyUnlocked.map((a) => ({
      kind: a.id,
      label: a.label,
      emoji: a.emoji,
    }));

    navigation.replace('Result', {
      summary: { ...summaryBase, milestones, achievementUnlocks },
    });
  }, [profile, players, collectedWedges, questions, update, navigation]);

  const advance = useCallback(() => {
    clearTimers();
    progress.stopAnimation();
    matchStreak.current = 0;
    if (index + 1 >= questions.length) {
      finishMatch();
    } else {
      setIndex((i) => i + 1);
      setTurn((t) => t + 1);
      setSelected(null);
      setLocked(false);
    }
  }, [index, questions.length, finishMatch, clearTimers, progress]);

  const recordAndAdvance = useCallback(
    (sel: number | null) => {
      const q = questions[index];
      const ms = sel === null ? ROUND_TIME_MS : Date.now() - roundStart.current;
      const correct = sel !== null && sel === q.answer;
      const points = scoreAnswer(correct, ms);
      rounds.current.push({ questionId: q.id, selected: sel, correct, ms, points });

      if (correct) {
        matchStreak.current += 1;
        void hapticSuccess();
        const streakFx = streakCelebration(matchStreak.current, q.category);
        setCollectedWedges((w) => {
          const isNew = !w.includes(q.category);
          if (streakFx) {
            setCelebration(streakFx);
            if (profile) {
              void announceCelebration(streakFx, {
                preset: profile.voicePreset,
                enabled: profile.voiceEnabled,
              });
            }
          } else if (isNew) {
            const wedgeFx = wedgeCelebration(q.category);
            setCelebration(wedgeFx);
            if (profile) {
              void announceCelebration(wedgeFx, {
                preset: profile.voicePreset,
                enabled: profile.voiceEnabled,
              });
            }
          }
          return isNew ? [...w, q.category] : w;
        });
      } else {
        matchStreak.current = 0;
      }

      setPlayers((list) =>
        list.map((p) => (p.id === active.id ? { ...p, score: p.score + points } : p))
      );

      const t = setTimeout(advance, 1100);
      timers.current.push(t);
    },
    [questions, index, advance, active.id, profile]
  );

  const onSelect = useCallback(
    (i: number) => {
      if (locked) return;
      setLocked(true);
      setSelected(i);
      recordAndAdvance(i);
    },
    [locked, recordAndAdvance]
  );

  useEffect(() => {
    if (phase !== 'playing') return;
    roundStart.current = Date.now();
    progress.setValue(1);
    Animated.timing(progress, {
      toValue: 0,
      duration: ROUND_TIME_MS,
      useNativeDriver: false,
    }).start();

    const timeout = setTimeout(() => {
      if (!locked) {
        setLocked(true);
        recordAndAdvance(null);
      }
    }, ROUND_TIME_MS);
    timers.current.push(timeout);

    return clearTimers;
  }, [phase, index, turn, locked, recordAndAdvance, clearTimers, progress]);

  if (phase === 'countdown') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.countdown}>{countdown === 0 ? 'GO!' : countdown}</Text>
        <Text style={styles.turnHint}>Pass the phone when your turn ends</Text>
      </SafeAreaView>
    );
  }

  const q = questions[index];
  const catTheme = getCategoryTheme(q.category);
  const widthInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <MatchCelebrationOverlay payload={celebration} onDone={() => setCelebration(null)} />

      <View style={styles.turnCard}>
        <AvatarView avatar={active.avatar} size={40} />
        <View>
          <Text style={styles.turnLabel}>{active.name}'s turn</Text>
          <Text style={styles.turnScore}>{active.score} pts</Text>
        </View>
        <Text style={styles.qProgress}>
          Q{index + 1}/{questions.length}
        </Text>
      </View>

      <WedgeTracker collected={collectedWedges} />

      <View style={styles.timerTrack}>
        <Animated.View style={[styles.timerFill, { width: widthInterpolate, backgroundColor: catTheme.fill }]} />
      </View>

      <View style={styles.qWrap}>
        <TriviaCard
          category={q.category}
          prompt={q.prompt}
          questionNum={index + 1}
          total={questions.length}
          year={q.year}
          tier={q.tier}
          onSpeak={() =>
            profile &&
            void speakQuestion(q.prompt, {
              preset: profile.voicePreset,
              enabled: profile.voiceEnabled,
            })
          }
        />
      </View>

      <View style={styles.options}>
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const reveal = locked;
          const isAnswer = i === q.answer;
          let bg = colors.card;
          let border = catTheme.fill;
          if (reveal && isAnswer) {
            bg = colors.success;
            border = colors.success;
          } else if (reveal && isSelected && !isAnswer) {
            bg = colors.danger;
            border = colors.danger;
          }
          return (
            <Pressable
              key={i}
              onPress={() => onSelect(i)}
              disabled={locked}
              style={({ pressed }) => [
                styles.option,
                { backgroundColor: bg, borderColor: border, borderWidth: 2 },
                pressed && !locked && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.optionLetter}>{String.fromCharCode(65 + i)}</Text>
              <Text style={styles.optionText}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  countdown: {
    color: colors.primary,
    fontSize: 96,
    fontWeight: '900',
  },
  turnHint: {
    color: colors.textMuted,
    fontSize: font.body,
    fontWeight: '700',
  },
  turnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  turnLabel: {
    color: colors.gold,
    fontSize: font.h3,
    fontWeight: '900',
  },
  turnScore: {
    color: colors.textMuted,
    fontSize: font.small,
    fontWeight: '700',
  },
  qProgress: {
    marginLeft: 'auto',
    color: colors.textFaint,
    fontWeight: '800',
  },
  timerTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  timerFill: {
    height: 8,
    borderRadius: radius.pill,
  },
  qWrap: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  options: {
    gap: spacing.sm,
    marginTop: 'auto',
    marginBottom: spacing.lg,
  },
  option: {
    minHeight: 56,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  optionLetter: {
    color: colors.gold,
    fontSize: font.body,
    fontWeight: '900',
    width: 24,
  },
  optionText: {
    flex: 1,
    color: colors.text,
    fontSize: font.body,
    fontWeight: '700',
  },
});
