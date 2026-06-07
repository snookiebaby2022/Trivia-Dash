import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarView } from '../components/AvatarView';
import { FloatingReactions } from '../components/FloatingReactions';
import { LiveStatsPanel } from '../components/LiveStatsPanel';
import { MatchCelebrationOverlay } from '../components/MatchCelebrationOverlay';
import { ReactionBar } from '../components/ReactionBar';
import { TriviaCard } from '../components/TriviaCard';
import { WedgeTracker } from '../components/WedgeTracker';
import { useProfile } from '../context/ProfileContext';
import { pickMatchQuestions } from '../data/questions';
import { getCategoryTheme } from '../lib/categoryTheme';
import { nextElo } from '../lib/elo';
import { ghostAnswerSeeded } from '../lib/ghost';
import { reportPartyScore, subscribePartyLobby } from '../lib/matchmaking';
import {
  applyResult,
  initFromCompetitors,
  mergeScore,
  startRound,
} from '../lib/matchStats';
import { QUAD_QUESTIONS, sortStandings } from '../lib/quad';
import { ROUND_TIME_MS, scoreAnswer } from '../lib/scoring';
import { finalizeProfileAfterMatch } from '../lib/achievements';
import {
  announceCelebration,
  hapticSuccess,
  streakCelebration,
  wedgeCelebration,
  type CelebrationPayload,
} from '../lib/celebrations';
import { detectMilestones } from '../lib/milestones';
import {
  makeLocalReaction,
  sendPartyReaction,
  subscribePartyReactions,
  type ReactionEmoji,
} from '../lib/reactions';
import { speakQuestion, stopSpeaking } from '../lib/speech';
import type { RootStackParamList } from '../navigation';
import { colors, font, radius, spacing } from '../theme';
import type {
  Category,
  Competitor,
  PartyReaction,
  PlayerLiveStats,
  Question,
  RoundResult,
} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'QuadGame'>;
type Phase = 'countdown' | 'playing';

export function QuadGameScreen({ navigation, route }: Props) {
  const { profile, update } = useProfile();
  const { competitors: initial, questionSeed, botDifficulty, lobbyId, isOnline } = route.params;

  const [competitors, setCompetitors] = useState<Competitor[]>(initial);
  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [collectedWedges, setCollectedWedges] = useState<Category[]>([]);
  const [liveStats, setLiveStats] = useState<PlayerLiveStats[]>(() =>
    initFromCompetitors(initial, QUAD_QUESTIONS)
  );
  const [celebration, setCelebration] = useState<CelebrationPayload | null>(null);
  const [reactions, setReactions] = useState<PartyReaction[]>([]);

  const questions = useMemo<Question[]>(
    () =>
      pickMatchQuestions(QUAD_QUESTIONS, questionSeed, {
        isPro: profile?.isPro ?? false,
      }),
    [questionSeed, profile?.isPro]
  );

  const rounds = useRef<RoundResult[]>([]);
  const matchStreak = useRef(0);
  const roundStart = useRef(0);
  const progress = useRef(new Animated.Value(1)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const competitorsRef = useRef(competitors);
  competitorsRef.current = competitors;

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    if (!lobbyId) return;
    const unsub = subscribePartyReactions(lobbyId, (r) => {
      setReactions((prev) => [...prev, r].slice(-12));
    });
    return () => unsub?.();
  }, [lobbyId]);

  useEffect(() => {
    if (phase !== 'playing' || !profile) return;
    const q = questions[index];
    if (!q) return;
    void speakQuestion(q.prompt, {
      preset: profile.voicePreset,
      enabled: profile.voiceEnabled,
    });
  }, [phase, index, questions, profile?.voicePreset, profile?.voiceEnabled, profile]);

  useEffect(() => {
    if (!lobbyId || !profile) return;
    const channel = subscribePartyLobby(lobbyId, (lobby) => {
      if (!lobby) return;
      setLiveStats((s) => {
        let next = s;
        for (const p of lobby.players) {
          if (p.playerId !== profile.id) {
            next = mergeScore(next, p.playerId, p.score);
          }
        }
        return next;
      });
      setCompetitors((prev) =>
        prev.map((c) => {
          const remote = lobby.players.find((p) => p.playerId === c.id);
          return remote ? { ...c, score: remote.score } : c;
        })
      );
    });
    return () => {
      channel?.unsubscribe();
    };
  }, [lobbyId, profile]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setPhase('playing');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 700);
    timers.current.push(t);
  }, [phase, countdown]);

  const finishMatch = useCallback(() => {
    if (!profile) return;
    const standings = sortStandings(competitorsRef.current);
    const you = standings.find((s) => s.isYou);
    const youRank = you?.rank ?? 4;
    const top = standings[0];
    const beatYou = standings.find((s) => !s.isYou && s.rank === 1);
    const rivalElo =
      competitorsRef.current.find((c) => c.id === beatYou?.id)?.elo ??
      competitorsRef.current.find((c) => !c.isYou)?.elo ??
      1000;

    const outcome =
      youRank === 1 ? 'win' : youRank === 2 ? 'draw' : ('loss' as const);
    const score = youRank === 1 ? 1 : youRank === 2 ? 0.5 : 0;
    const newElo = nextElo(profile.elo, rivalElo, score);
    const eloDelta = newElo - profile.elo;
    const streak = youRank === 1 ? profile.streak + 1 : 0;

    const profilePatch = {
      elo: newElo,
      wins: profile.wins + (youRank === 1 ? 1 : 0),
      losses: profile.losses + (youRank >= 3 ? 1 : 0),
      draws: profile.draws + (youRank === 2 ? 1 : 0),
      streak,
      bestStreak: Math.max(profile.bestStreak, streak),
    };

    const summaryBase = {
      you: you?.score ?? 0,
      opponent: top.score,
      opponentName: top.name,
      opponentAvatar: top.avatar,
      rounds: rounds.current,
      outcome,
      eloDelta,
      newElo,
      mode: 'quad' as const,
      isOnline: isOnline ?? false,
      partyRank: youRank,
      partySize: 4,
      standings,
      botDifficulty,
      collectedWedges,
    };

    const correctCategories = rounds.current
      .filter((r) => r.correct)
      .map((r) => questions.find((q) => q.id === r.questionId)?.category)
      .filter((c): c is Category => Boolean(c));

    const { profile: enriched, newlyUnlocked } = finalizeProfileAfterMatch(
      profile,
      profilePatch,
      summaryBase,
      correctCategories
    );

    void update({
      ...profilePatch,
      achievementState: enriched.achievementState,
      stats: enriched.stats,
    });

    const milestones = detectMilestones(profile, summaryBase, {
      wins: profile.wins + (youRank === 1 ? 1 : 0),
      streak,
      dailyStreak: profile.dailyStreak,
      newElo,
    });

    const achievementUnlocks = newlyUnlocked.map((a) => ({
      kind: a.id,
      label: a.label,
      emoji: a.emoji,
    }));

    navigation.replace('Result', {
      summary: { ...summaryBase, milestones, achievementUnlocks },
    });
  }, [profile, update, navigation, botDifficulty, isOnline, collectedWedges, questions]);

  const advance = useCallback(() => {
    clearTimers();
    progress.stopAnimation();
    if (index + 1 >= questions.length) {
      finishMatch();
    } else {
      setIndex((i) => i + 1);
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

      if (profile) {
        setLiveStats((s) => applyResult(s, profile.id, { correct, ms, points }));
      }

      setCompetitors((prev) => {
        const next = prev.map((c) =>
          c.isYou ? { ...c, score: c.score + points } : c
        );
        const you = next.find((c) => c.isYou);
        if (lobbyId && you) void reportPartyScore(lobbyId, you.id, you.score);
        return next;
      });

      const t = setTimeout(advance, 1100);
      timers.current.push(t);
    },
    [questions, index, advance, lobbyId]
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
    setLiveStats((s) => startRound(s));
    roundStart.current = Date.now();
    progress.setValue(1);
    Animated.timing(progress, {
      toValue: 0,
      duration: ROUND_TIME_MS,
      useNativeDriver: false,
    }).start();

    competitors.forEach((c) => {
      if (!c.isBot || !c.ghost) return;
      const ghost = c.ghost;
      const move = ghostAnswerSeeded(ghost, questions[index], index, c.id, questionSeed);
      const gt = setTimeout(() => {
        setLiveStats((s) =>
          applyResult(s, c.id, {
            correct: move.correct,
            ms: move.ms,
            points: move.points,
          })
        );
        setCompetitors((prev) =>
          prev.map((p) => (p.id === c.id ? { ...p, score: p.score + move.points } : p))
        );
      }, Math.min(move.ms, ROUND_TIME_MS));
      timers.current.push(gt);
    });

    const timeout = setTimeout(() => {
      if (!locked) {
        setLocked(true);
        recordAndAdvance(null);
      }
    }, ROUND_TIME_MS);
    timers.current.push(timeout);

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index]);

  const q = questions[index];
  const catTheme = getCategoryTheme(q.category);
  const widthInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (phase === 'countdown') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.countdownTitle}>4-Player Showdown</Text>
        <View style={styles.countdownRow}>
          {competitors.map((c) => (
            <View key={c.id} style={styles.countdownPlayer}>
              <AvatarView avatar={c.avatar} size={48} showRing={c.isYou} />
              <Text style={styles.countdownName} numberOfLines={1}>
                {c.name}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.countdown}>{countdown === 0 ? 'GO!' : countdown}</Text>
      </SafeAreaView>
    );
  }

  const onReact = (emoji: ReactionEmoji) => {
    if (!profile) return;
    const reaction = makeLocalReaction(profile.id, profile.username, emoji);
    setReactions((prev) => [...prev, reaction].slice(-12));
    if (lobbyId) {
      void sendPartyReaction(lobbyId, profile.id, profile.username, emoji);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <MatchCelebrationOverlay payload={celebration} onDone={() => setCelebration(null)} />
      <FloatingReactions reactions={reactions} />

      <LiveStatsPanel
        players={liveStats}
        layout="quad"
        questionIndex={index + 1}
        totalQuestions={questions.length}
        live
      />

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

      {lobbyId ? <ReactionBar onReact={onReact} disabled={locked} /> : null}

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
    paddingHorizontal: spacing.lg,
  },
  countdownTitle: {
    color: colors.textMuted,
    fontSize: font.h3,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  countdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  countdownPlayer: { alignItems: 'center', width: 72 },
  countdownName: {
    color: colors.textFaint,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  countdown: {
    color: colors.primary,
    fontSize: 96,
    fontWeight: '900',
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
    backgroundColor: colors.warning,
  },
  qWrap: { marginTop: spacing.md, marginBottom: spacing.md },
  options: { gap: spacing.sm, marginTop: 'auto', marginBottom: spacing.lg },
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
