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
import { normalizeAvatar } from '../lib/avatars';
import { buildShareGrid, nextDailyStreakWithShield, todayKey } from '../lib/daily';
import { getCategoryTheme } from '../lib/categoryTheme';
import { nextElo } from '../lib/elo';
import { ghostAnswer, makeGhost, type Ghost } from '../lib/ghost';
import {
  fetchPartyLobby,
  joinQuickMatchQueue,
  reportOnlineScore,
  reportPartyScore,
  subscribeOnlineMatch,
} from '../lib/matchmaking';
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
import {
  applyResult,
  initDuel,
  mergeScore,
  startRound,
} from '../lib/matchStats';
import type { RootStackParamList } from '../navigation';
import { colors, font, radius, spacing } from '../theme';
import type {
  Category,
  MatchSummary,
  OpponentInfo,
  PartyReaction,
  PlayerLiveStats,
  Question,
  RoundResult,
} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;
type Phase = 'searching' | 'countdown' | 'playing';

export function GameScreen({ navigation, route }: Props) {
  const params = route.params ?? { mode: 'solo' as const };
  const { profile, update } = useProfile();

  const [opponent, setOpponent] = useState<OpponentInfo | null>(params.opponent ?? null);
  const [matchId, setMatchId] = useState<string | undefined>(params.matchId);
  const [questionSeed, setQuestionSeed] = useState(params.questionSeed);
  const [searchLabel, setSearchLabel] = useState('Finding party players…');

  const ghost = useMemo<Ghost>(() => {
    if (opponent && !opponent.isHuman) return makeGhost(profile?.elo ?? 1000);
    if (opponent?.isHuman) {
      return {
        name: opponent.name,
        elo: opponent.elo,
        accuracy: Math.max(0.45, Math.min(0.92, 0.5 + (opponent.elo - 1000) / 2200)),
        speedMs: [1200, 5500] as [number, number],
      };
    }
    return makeGhost(profile?.elo ?? 1000);
  }, [opponent, profile?.elo]);

  const questions = useMemo<Question[]>(() => {
    return pickMatchQuestions(7, questionSeed, {
      isPro: profile?.isPro ?? false,
      questionIds: params.questionIds,
    });
  }, [questionSeed, profile?.isPro, params.questionIds]);

  const [phase, setPhase] = useState<Phase>(params.mode === 'quick' ? 'searching' : 'countdown');
  const [countdown, setCountdown] = useState(3);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [youScore, setYouScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [collectedWedges, setCollectedWedges] = useState<Category[]>([]);
  const [liveStats, setLiveStats] = useState<PlayerLiveStats[]>([]);
  const [celebration, setCelebration] = useState<CelebrationPayload | null>(null);
  const [reactions, setReactions] = useState<PartyReaction[]>([]);

  const rounds = useRef<RoundResult[]>([]);
  const matchStreak = useRef(0);
  const roundStart = useRef(0);
  const progress = useRef(new Animated.Value(1)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const oppScoreRef = useRef(0);
  const statsInit = useRef(false);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => () => stopSpeaking(), []);

  const showReactions = params.mode === 'party' || Boolean(params.lobbyId);

  useEffect(() => {
    if (!params.lobbyId || !showReactions) return;
    const unsub = subscribePartyReactions(params.lobbyId, (r) => {
      setReactions((prev) => [...prev, r].slice(-12));
    });
    return () => unsub?.();
  }, [params.lobbyId, showReactions]);

  useEffect(() => {
    if (phase !== 'playing' || !profile) return;
    const q = questions[index];
    if (!q) return;
    void speakQuestion(q.prompt, {
      preset: profile.voicePreset,
      enabled: profile.voiceEnabled,
    });
  }, [phase, index, questions, profile?.voicePreset, profile?.voiceEnabled, profile]);

  // Quick match: try Supabase Realtime queue, fall back to ghost.
  useEffect(() => {
    if (params.mode !== 'quick' || !profile || params.opponent) {
      if (params.mode !== 'quick') setPhase('countdown');
      return;
    }

    let cancelled = false;
    setSearchLabel('Searching for a real opponent…');

    void joinQuickMatchQueue(profile).then((match) => {
      if (cancelled) return;
      if (match) {
        setOpponent(match.opponent);
        setMatchId(match.id);
        setQuestionSeed(match.questionSeed);
        setSearchLabel('Matched! Get ready…');
      } else {
        const g = makeGhost(profile.elo);
        setOpponent({
          id: 'ghost',
          name: g.name,
          avatar: normalizeAvatar({ emoji: '🤖', color: '#7C5CFF' }),
          elo: g.elo,
          isHuman: false,
        });
        setSearchLabel('No one online — practice bot joined');
      }
      setTimeout(() => setPhase('countdown'), 900);
    });

    return () => {
      cancelled = true;
    };
  }, [params.mode, params.opponent, profile]);

  // Live score sync for human matches.
  useEffect(() => {
    if (!matchId || !profile || !opponent?.isHuman) return;
    const channel = subscribeOnlineMatch(matchId, profile.id, ({ opponent: score }) => {
      oppScoreRef.current = score;
      setOppScore(score);
    });
    return () => {
      channel?.unsubscribe();
    };
  }, [matchId, profile, opponent?.isHuman]);

  useEffect(() => {
    if (!profile || phase === 'searching' || statsInit.current) return;
    const oppId = opponent?.id ?? 'ghost';
    setLiveStats(
      initDuel(
        { id: profile.id, name: profile.username, avatar: profile.avatar },
        {
          id: oppId,
          name: opponent?.name ?? ghost.name,
          avatar: normalizeAvatar(opponent?.avatar ?? { emoji: '🤖', color: '#7C5CFF' }),
          isHuman: opponent?.isHuman ?? false,
        },
        questions.length
      )
    );
    statsInit.current = true;
  }, [profile, opponent, ghost.name, questions.length, phase]);

  useEffect(() => {
    if (!opponent?.isHuman || liveStats.length === 0) return;
    setLiveStats((s) => mergeScore(s, opponent.id, oppScore));
  }, [oppScore, opponent?.isHuman, opponent?.id, liveStats.length]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setPhase('playing');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 700);
    timers.current.push(t);
  }, [phase, countdown]);

  const finishMatch = useCallback(async () => {
    if (!profile) return;
    const you = rounds.current.reduce((s, r) => s + r.points, 0);
    const opp = oppScoreRef.current || oppScore;
    const outcome: MatchSummary['outcome'] = you > opp ? 'win' : you < opp ? 'loss' : 'draw';
    const score = outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0;
    const oppElo = opponent?.elo ?? ghost.elo;
    const newElo = params.mode === 'daily' ? profile.elo : nextElo(profile.elo, oppElo, score);
    const eloDelta = newElo - profile.elo;

    const streak = outcome === 'win' ? profile.streak + 1 : 0;
    const dateKey = todayKey();
    const dailyResult =
      params.mode === 'daily'
        ? nextDailyStreakWithShield(
            profile.lastDailyDate,
            dateKey,
            profile.dailyStreak,
            profile.streakShield
          )
        : null;
    const dailyStreak = dailyResult?.streak ?? profile.dailyStreak;

    const profilePatch = {
      elo: newElo,
      wins: profile.wins + (outcome === 'win' ? 1 : 0),
      losses: profile.losses + (outcome === 'loss' ? 1 : 0),
      draws: profile.draws + (outcome === 'draw' ? 1 : 0),
      streak,
      bestStreak: Math.max(profile.bestStreak, streak),
      dailyStreak,
      lastDailyDate: params.mode === 'daily' ? dateKey : profile.lastDailyDate,
      streakShield: dailyResult?.consumedShield ? false : profile.streakShield,
    };

    let partyRank: number | undefined;
    let partySize: number | undefined;

    if (params.mode === 'party' && params.lobbyId) {
      await reportPartyScore(params.lobbyId, profile.id, you);
      const lobby = await fetchPartyLobby(params.lobbyId);
      if (lobby) {
        partySize = lobby.players.length;
        const sorted = [...lobby.players].sort((a, b) => b.score - a.score);
        partyRank = sorted.findIndex((p) => p.playerId === profile.id) + 1;
      }
    }

    const shareGrid = buildShareGrid(rounds.current, dateKey, you, dailyStreak);
    const nextWins = profile.wins + (outcome === 'win' ? 1 : 0);

    const summaryBase: MatchSummary = {
      you,
      opponent: opp,
      opponentName: opponent?.name ?? ghost.name,
      opponentAvatar: opponent?.avatar,
      rounds: rounds.current,
      outcome,
      eloDelta: params.mode === 'daily' ? 0 : eloDelta,
      newElo: params.mode === 'daily' ? profile.elo : newElo,
      mode: params.mode,
      isOnline: Boolean(opponent?.isHuman),
      shareGrid,
      partyRank,
      partySize,
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
      wins: nextWins,
      streak,
      dailyStreak,
      newElo: summaryBase.newElo,
    });

    const achievementUnlocks = newlyUnlocked.map((a) => ({
      kind: a.id,
      label: a.label,
      emoji: a.emoji,
    }));

    navigation.replace('Result', {
      summary: { ...summaryBase, milestones, achievementUnlocks },
    });
  }, [profile, oppScore, ghost, opponent, update, navigation, params, collectedWedges, questions]);

  const advance = useCallback(() => {
    clearTimers();
    progress.stopAnimation();
    if (index + 1 >= questions.length) {
      void finishMatch();
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
      setYouScore((s) => {
        const next = s + points;
        if (matchId && profile) void reportOnlineScore(matchId, profile.id, next, index + 1);
        if (params.lobbyId && profile) void reportPartyScore(params.lobbyId, profile.id, next);
        return next;
      });
      const t = setTimeout(advance, 1100);
      timers.current.push(t);
    },
    [questions, index, advance, matchId, profile, params.lobbyId]
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
    setLiveStats((s) => (s.length ? startRound(s) : s));
    roundStart.current = Date.now();
    progress.setValue(1);
    Animated.timing(progress, {
      toValue: 0,
      duration: ROUND_TIME_MS,
      useNativeDriver: false,
    }).start();

    // Ghost / bot simulates opponent when not live-synced from a human.
    if (!opponent?.isHuman || params.mode === 'party') {
      const move = ghostAnswer(ghost, questions[index]);
      const oppId = opponent?.id ?? 'ghost';
      const gt = setTimeout(() => {
        setLiveStats((s) =>
          applyResult(s, oppId, {
            correct: move.correct,
            ms: move.ms,
            points: move.points,
          })
        );
        setOppScore((s) => {
          const next = s + move.points;
          oppScoreRef.current = next;
          return next;
        });
      }, Math.min(move.ms, ROUND_TIME_MS));
      timers.current.push(gt);
    }

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

  const oppName = opponent?.name ?? ghost.name;

  if (phase === 'searching') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.searchPulse}>{searchLabel}</Text>
        <Text style={styles.searchSub}>Party trivia matchmaking</Text>
      </SafeAreaView>
    );
  }

  if (phase === 'countdown') {
    return (
      <SafeAreaView style={styles.center}>
        <View style={styles.vsRow}>
          <AvatarView avatar={profile!.avatar} size={64} showRing />
          <Text style={styles.vsX}>VS</Text>
          <AvatarView avatar={normalizeAvatar(opponent?.avatar ?? { emoji: '🤖', color: '#7C5CFF' })} size={64} showRing />
        </View>
        <Text style={styles.vs}>{profile?.username}  vs  {oppName}</Text>
        <Text style={styles.countdown}>{countdown === 0 ? 'GO!' : countdown}</Text>
      </SafeAreaView>
    );
  }

  const q = questions[index];
  const catTheme = getCategoryTheme(q.category);
  const widthInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const onReact = (emoji: ReactionEmoji) => {
    if (!profile) return;
    const reaction = makeLocalReaction(profile.id, profile.username, emoji);
    setReactions((prev) => [...prev, reaction].slice(-12));
    if (params.lobbyId) {
      void sendPartyReaction(params.lobbyId, profile.id, profile.username, emoji);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <MatchCelebrationOverlay payload={celebration} onDone={() => setCelebration(null)} />
      <FloatingReactions reactions={reactions} />

      {liveStats.length > 0 && (
        <LiveStatsPanel
          players={liveStats}
          layout="duel"
          questionIndex={index + 1}
          totalQuestions={questions.length}
          live
        />
      )}

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

      {showReactions && <ReactionBar onReact={onReact} disabled={locked} />}

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
  searchPulse: {
    color: colors.text,
    fontSize: font.h2,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  searchSub: {
    color: colors.textMuted,
    fontSize: font.body,
  },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  vsX: {
    color: colors.accent,
    fontSize: font.h2,
    fontWeight: '900',
  },
  vs: {
    color: colors.textMuted,
    fontSize: font.h3,
    fontWeight: '700',
    marginBottom: spacing.md,
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
