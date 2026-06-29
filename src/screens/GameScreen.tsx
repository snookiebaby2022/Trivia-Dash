import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarView } from '../components/AvatarView';
import { FloatingReactions } from '../components/FloatingReactions';
import { LiveStatsPanel } from '../components/LiveStatsPanel';
import { MatchCelebrationOverlay } from '../components/MatchCelebrationOverlay';
import { ReactionBar } from '../components/ReactionBar';
import { PowerUpBar } from '../components/PowerUpBar';
import { TriviaCard } from '../components/TriviaCard';
import { WedgeTracker } from '../components/WedgeTracker';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
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
import { comboLabel } from '../lib/combo';
import { COINS_PER_CORRECT } from '../lib/coins';
import {
  applyFiftyFifty,
  consumePowerUp,
  defaultPowerUpInventory,
  EXTRA_TIME_MS,
} from '../lib/powerUps';
import { ROUND_TIME_MS, scoreAnswer } from '../lib/scoring';
import { finalizeProfileAfterMatch } from '../lib/achievements';
import { syncPlayGamesAfterMatch } from '../lib/playGames';
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
import { speakQuestion, speakLine, stopSpeaking } from '../lib/speech';
import { isHarveyStylePack } from '../lib/voiceCatalog';
import {
  applyResult,
  initDuel,
  mergeScore,
  startRound,
} from '../lib/matchStats';
import type { RootStackParamList } from '../navigation';
import { countdownLabel, countdownVoiceLine, hostIntroLine } from '../lib/gameShow';
import { getRecentQuestionIds } from '../lib/questionHistory';
import { startCategoryAmbience, stopCategoryAmbience } from '../lib/categoryAmbience';
import { canUsePictureRounds } from '../lib/entitlements';
import { submitDailyScore } from '../lib/dailyLeaderboard';
import { submitOnlineHighScore } from '../lib/leaderboard';
import { makeBot } from '../lib/ghost';
import { buildSeasonXpSnapshot, ensureSeasonPass } from '../lib/seasonPass';
import { bumpCategoryPlay } from '../lib/categoryStats';
import { WEDGE_UNLOCK_CORRECT } from '../lib/wedges';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';
import type {
  Category,
  MatchSummary,
  OpponentInfo,
  PartyReaction,
  PlayerLiveStats,
  PowerUpType,
  Profile,
  Question,
  RoundResult,
} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;
type Phase = 'searching' | 'countdown' | 'playing';

export function GameScreen({ navigation, route }: Props) {
  const params = route.params ?? { mode: 'solo' as const };
  const { profile, update, grantMatchCoins } = useProfile();
  const { colors } = useTheme();
  const styles = useMemo(() => makeGameStyles(colors), [colors]);

  const [opponent, setOpponent] = useState<OpponentInfo | null>(params.opponent ?? null);
  const [matchId, setMatchId] = useState<string | undefined>(params.matchId);
  const [questionSeed, setQuestionSeed] = useState(
    params.questionSeed ?? Date.now() ^ Math.floor(Math.random() * 1e9)
  );
  const [searchLabel, setSearchLabel] = useState('Finding party players…');

  const botDiff = params.botDifficulty ?? 'easy';
  const isEndless = params.mode === 'endless';
  const isTimed = params.mode === 'timed';
  const isSoloLike =
    params.mode === 'solo' ||
    params.mode === 'practice' ||
    isEndless ||
    isTimed;
  const isRanked = params.mode === 'ranked';

  const ghost = useMemo<Ghost>(() => {
    if (isSoloLike) return makeBot(botDiff, 0);
    if (isRanked && !opponent?.isHuman) return makeBot(botDiff, 0);
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
  }, [opponent, profile?.elo, isSoloLike, isRanked, botDiff]);

  const questions = useMemo<Question[]>(() => {
    const includePictures =
      canUsePictureRounds(profile?.isPro ?? false) &&
      !params.ugcPackId &&
      (params.mode === 'ranked' || params.mode === 'practice' || params.mode === 'solo');
    const count =
      params.ugcPackId && params.questionIds?.length
        ? Math.min(params.questionIds.length, 15)
        : isEndless
          ? 30
          : isTimed
            ? 50
            : 7;
    return pickMatchQuestions(count, questionSeed, {
      isPro: profile?.isPro ?? false,
      questionIds: params.questionIds,
      category: params.category,
      includePictures,
      recentIds: getRecentQuestionIds(profile?.stats),
    });
  }, [
    questionSeed,
    profile?.isPro,
    profile?.stats,
    params.questionIds,
    params.category,
    params.mode,
    params.ugcPackId,
    isEndless,
    isTimed,
  ]);

  const [phase, setPhase] = useState<Phase>(
    params.mode === 'quick' || isRanked ? 'searching' : 'countdown'
  );
  const [countdown, setCountdown] = useState(3);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [revealAnswers, setRevealAnswers] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [youScore, setYouScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [liveStats, setLiveStats] = useState<PlayerLiveStats[]>([]);
  const [celebration, setCelebration] = useState<CelebrationPayload | null>(null);
  const [reactions, setReactions] = useState<PartyReaction[]>([]);
  const [visibleOptions, setVisibleOptions] = useState<number[] | null>(null);
  const [comboFlash, setComboFlash] = useState<string | null>(null);
  const [timedLeftMs, setTimedLeftMs] = useState(90_000);

  const rounds = useRef<RoundResult[]>([]);
  const matchStreak = useRef(0);
  const maxComboStreak = useRef(0);
  const endlessWrong = useRef(0);
  const extraTimeMs = useRef(0);
  const roundStart = useRef(0);
  const progress = useRef(new Animated.Value(1)).current;
  const countdownScale = useRef(new Animated.Value(1)).current;
  const optionAnims = useRef(
    [0, 1, 2, 3].map(() => new Animated.Value(0))
  ).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const oppScoreRef = useRef(0);
  const statsInit = useRef(false);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => () => {
    stopSpeaking();
    stopCategoryAmbience();
  }, []);

  const showReactions = params.mode === 'party' || Boolean(params.lobbyId);

  useEffect(() => {
    if (!params.lobbyId || !showReactions) return;
    const unsub = subscribePartyReactions(params.lobbyId, (r) => {
      setReactions((prev) => [...prev, r].slice(-12));
    });
    return () => unsub?.();
  }, [params.lobbyId, showReactions]);

  useEffect(() => {
    if (phase !== 'countdown' || !profile?.voiceEnabled) return;
    void speakLine(countdownVoiceLine(countdown), {
      preset: profile.voicePreset,
      enabled: true,
    });
  }, [phase, countdown, profile?.voiceEnabled, profile?.voicePreset]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    countdownScale.setValue(0.6);
    Animated.spring(countdownScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [phase, countdown, countdownScale]);

  useEffect(() => {
    if (phase !== 'playing' || !profile) return;
    const q = questions[index];
    if (!q) return;

    setOptionsVisible(false);
    setRevealAnswers(false);
    optionAnims.forEach((a) => a.setValue(0));

    let cancelled = false;

    const showOptions = () => {
      if (cancelled) return;
      setOptionsVisible(true);
      Animated.stagger(
        80,
        optionAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        )
      ).start();
    };

    const runVoice = async () => {
      void startCategoryAmbience(q.category);
      if (profile.voiceEnabled) {
        await speakQuestion(hostIntroLine(index + 1, questions.length, q.category), {
          preset: profile.voicePreset,
          enabled: true,
        });
        if (cancelled) return;
        await speakQuestion(q.prompt, {
          preset: profile.voicePreset,
          enabled: true,
        });
        if (cancelled) return;
        setTimeout(showOptions, 280);
      } else {
        setTimeout(showOptions, 350);
      }
    };

    void runVoice();

    return () => {
      cancelled = true;
    };
  }, [phase, index, questions, profile?.voicePreset, profile?.voiceEnabled, profile, optionAnims]);

  // Quick match: try Supabase Realtime queue, fall back to ghost.
  useEffect(() => {
    const wantsMatchmaking = params.mode === 'quick' || params.mode === 'ranked';
    if (!wantsMatchmaking || !profile || params.opponent) {
      if (!wantsMatchmaking) setPhase('countdown');
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

    const isSolo =
      params.mode === 'solo' ||
      params.mode === 'practice' ||
      params.mode === 'endless' ||
      params.mode === 'timed';
    const profilePatch = isSolo
      ? {}
      : {
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
    };

    const correctCategories = rounds.current
      .filter((r) => r.correct)
      .map((r) => questions.find((q) => q.id === r.questionId)?.category)
      .filter((c): c is Category => Boolean(c));

    const { profile: enriched, newlyUnlocked, newWedges } = finalizeProfileAfterMatch(
      profile,
      profilePatch,
      summaryBase,
      correctCategories
    );

    const playCat = params.category ?? correctCategories[correctCategories.length - 1] ?? 'General';
    let seasonPass = ensureSeasonPass(profile.seasonPass);
    let xpGain = 0;
    let seasonXpSnapshot;
    if (params.mode !== 'practice') {
      const postWins = isSolo ? profile.wins : profile.wins + (outcome === 'win' ? 1 : 0);
      const postLosses = isSolo ? profile.losses : profile.losses + (outcome === 'loss' ? 1 : 0);
      const xpBundle = buildSeasonXpSnapshot(seasonPass, outcome, profile.isPro, postWins, postLosses);
      seasonPass = xpBundle.pass;
      xpGain = xpBundle.xpGain;
      seasonXpSnapshot = xpBundle.snapshot;
    }
    const dailyBests = { ...enriched.stats.dailyBests };
    if (params.mode === 'daily') {
      dailyBests[dateKey] = Math.max(dailyBests[dateKey] ?? 0, you);
      void submitDailyScore(enriched, you);
    }
    const stats = {
      ...bumpCategoryPlay(enriched, playCat, matchStreak.current),
      seasonXp: (enriched.stats.seasonXp ?? 0) + xpGain,
      dailyBests,
      bestMatchScore: Math.max(enriched.stats.bestMatchScore ?? 0, you),
    };

    const nextProfile: Profile = {
      ...enriched,
      ...profilePatch,
      stats,
      seasonPass,
    };

    void update(nextProfile);
    void submitOnlineHighScore(nextProfile, you);

    const summaryWithWedges: MatchSummary = {
      ...summaryBase,
      collectedWedges: newWedges,
    };

    const milestones = isSolo
      ? []
      : detectMilestones(profile, summaryWithWedges, {
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

    const correctCount = rounds.current.filter((r) => r.correct).length;
    const won = outcome === 'win' || (isSolo && you > 0);
    void grantMatchCoins(correctCount, won);

    void syncPlayGamesAfterMatch({
      score: you,
      maxComboStreak: maxComboStreak.current,
      unlockedAchievementIds: newlyUnlocked.map((a) => a.id),
    });

    navigation.replace('Result', {
      summary: { ...summaryWithWedges, milestones, achievementUnlocks, seasonXp: seasonXpSnapshot },
    });
  }, [profile, oppScore, ghost, opponent, update, navigation, params, questions, grantMatchCoins]);

  useEffect(() => {
    if (phase !== 'playing' || !isTimed) return;
    const tick = setInterval(() => {
      setTimedLeftMs((ms) => {
        if (ms <= 1000) {
          clearInterval(tick);
          void finishMatch();
          return 0;
        }
        return ms - 1000;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [phase, isTimed, finishMatch]);

  const advance = useCallback(() => {
    clearTimers();
    progress.stopAnimation();
    if (index + 1 >= questions.length) {
      void finishMatch();
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setLocked(false);
      setRevealAnswers(false);
      setOptionsVisible(false);
    }
  }, [index, questions.length, finishMatch, clearTimers, progress]);

  const recordAndAdvance = useCallback(
    (sel: number | null) => {
      const q = questions[index];
      const ms = sel === null ? ROUND_TIME_MS + extraTimeMs.current : Date.now() - roundStart.current;
      const correct = sel !== null && sel === q.answer;
      const streakForScore = correct ? matchStreak.current + 1 : matchStreak.current;
      const points = scoreAnswer(correct, ms, streakForScore);
      rounds.current.push({ questionId: q.id, selected: sel, correct, ms, points });
      if (correct) {
        matchStreak.current += 1;
        maxComboStreak.current = Math.max(maxComboStreak.current, matchStreak.current);
        const label = comboLabel(matchStreak.current);
        if (label) {
          setComboFlash(label);
          setTimeout(() => setComboFlash(null), 900);
        }
        void hapticSuccess();
        const harvey = profile?.voicePreset
          ? isHarveyStylePack(profile.voicePreset)
          : false;
        const streakFx = streakCelebration(matchStreak.current, q.category, harvey);
        const prevCorrect = profile?.stats.categoryCorrect[q.category] ?? 0;
        const willEarnWedge = prevCorrect + 1 === WEDGE_UNLOCK_CORRECT;
        if (willEarnWedge) {
          const wedgeFx = wedgeCelebration(q.category, harvey);
          setCelebration(wedgeFx);
          if (profile) {
            void announceCelebration(wedgeFx, {
              preset: profile.voicePreset,
              enabled: profile.voiceEnabled,
            });
          }
        } else if (streakFx) {
          setCelebration(streakFx);
          if (profile) {
            void announceCelebration(streakFx, {
              preset: profile.voicePreset,
              enabled: profile.voiceEnabled,
            });
          }
        }
      } else {
        matchStreak.current = 0;
        if (isEndless) {
          endlessWrong.current += 1;
          if (endlessWrong.current >= 3) {
            const t = setTimeout(() => void finishMatch(), 1100);
            timers.current.push(t);
            return;
          }
        }
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
    [questions, index, advance, matchId, profile, params.lobbyId, isEndless, finishMatch]
  );

  const usePowerUp = useCallback(
    (type: PowerUpType) => {
      if (!profile || locked) return;
      const next = consumePowerUp(profile, type);
      if (!next) return;
      void update(next);
      const q = questions[index];
      if (type === 'fiftyFifty') {
        setVisibleOptions(applyFiftyFifty(q));
      } else if (type === 'extraTime') {
        extraTimeMs.current += EXTRA_TIME_MS;
        progress.stopAnimation();
        progress.setValue(1);
        Animated.timing(progress, {
          toValue: 0,
          duration: ROUND_TIME_MS + extraTimeMs.current,
          useNativeDriver: false,
        }).start();
      } else if (type === 'skip') {
        setLocked(true);
        recordAndAdvance(null);
      }
    },
    [profile, locked, questions, index, update, progress, recordAndAdvance]
  );

  const onSelect = useCallback(
    (i: number) => {
      if (locked || !optionsVisible) return;
      setLocked(true);
      setSelected(i);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const revealTimer = setTimeout(() => {
        setRevealAnswers(true);
        void Haptics.notificationAsync(
          i === questions[index]?.answer
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Error
        );
        const advanceTimer = setTimeout(() => recordAndAdvance(i), 900);
        timers.current.push(advanceTimer);
      }, 650);
      timers.current.push(revealTimer);
    },
    [locked, optionsVisible, recordAndAdvance, questions, index]
  );

  useEffect(() => {
    if (phase !== 'playing') return;
    setLiveStats((s) => (s.length ? startRound(s) : s));
    roundStart.current = Date.now();
    progress.setValue(1);
    Animated.timing(progress, {
      toValue: 0,
      duration: ROUND_TIME_MS + extraTimeMs.current,
      useNativeDriver: false,
    }).start();

    // Ghost / bot simulates opponent when not live-synced from a human.
    if (params.mode === 'solo' || params.mode === 'practice') return;
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
        setRevealAnswers(true);
        const advanceTimer = setTimeout(() => recordAndAdvance(null), 700);
        timers.current.push(advanceTimer);
      }
    }, ROUND_TIME_MS + extraTimeMs.current);
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
        {isSoloLike ? (
          <>
            <AvatarView avatar={profile!.avatar} size={80} showRing />
            <Text style={styles.soloTitle}>
              {params.ugcPackTitle
                ? `📦 ${params.ugcPackTitle}`
                : isEndless
                  ? '♾️ Endless Dash'
                  : isTimed
                    ? '⏱ Timed Challenge'
                    : 'Quick Match'}
            </Text>
            <Text style={styles.soloSub}>
              {params.ugcPackTitle
                ? 'Community pack'
                : isEndless
                  ? '3 wrong answers ends the run · combo multipliers'
                  : isTimed
                    ? '90 seconds · answer as many as you can'
                    : 'Solo run · race the clock'}
            </Text>
          </>
        ) : (
          <>
            <View style={styles.vsRow}>
              <AvatarView avatar={profile!.avatar} size={64} showRing />
              <Text style={styles.vsX}>VS</Text>
              <AvatarView avatar={normalizeAvatar(opponent?.avatar ?? { emoji: '🤖', color: '#7C5CFF' })} size={64} showRing />
            </View>
            <Text style={styles.vs}>{profile?.username}  vs  {oppName}</Text>
          </>
        )}
        <Animated.Text
          style={[
            styles.countdown,
            { transform: [{ scale: countdownScale }] },
          ]}
        >
          {countdownLabel(countdown)}
        </Animated.Text>
        <Text style={styles.countdownHint}>Live from the Trivia Dash studio</Text>
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

      <View style={styles.timerTrack}>
        <Animated.View style={[styles.timerFill, { width: widthInterpolate, backgroundColor: catTheme.fill }]} />
      </View>
      {isTimed && (
        <Text style={styles.timedLabel}>⏱ {Math.ceil(timedLeftMs / 1000)}s left</Text>
      )}
      {comboFlash && <Text style={styles.comboFlash}>{comboFlash}</Text>}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {liveStats.length > 0 && params.mode !== 'solo' && params.mode !== 'practice' && (
          <LiveStatsPanel
            players={liveStats}
            layout="duel"
            questionIndex={index + 1}
            totalQuestions={questions.length}
            live
          />
        )}

        {profile && !isSoloLike && (
          <WedgeTracker profile={profile} highlight={q.category} />
        )}

        <View style={styles.qWrap}>
          <TriviaCard
            category={q.category}
            prompt={q.prompt}
            questionNum={index + 1}
            total={questions.length}
            year={q.year}
            tier={q.tier}
            imageUrl={q.imageUrl}
            compact
            onSpeak={() =>
              profile &&
              void speakQuestion(q.prompt, {
                preset: profile.voicePreset,
                enabled: profile.voiceEnabled,
              })
            }
          />
        </View>

        {profile && (isSoloLike || params.mode === 'daily') && (
          <PowerUpBar
            inventory={profile.powerUps ?? defaultPowerUpInventory()}
            disabled={locked}
            onUse={usePowerUp}
          />
        )}

        {showReactions && <ReactionBar onReact={onReact} disabled={locked} />}

        <View style={styles.options}>
          {!optionsVisible && (
            <Text style={styles.optionsWait}>Think about it… answers coming up</Text>
          )}
          {q.options.map((opt, i) => {
            if (visibleOptions && !visibleOptions.includes(i)) return null;
            const isSelected = selected === i;
            const reveal = revealAnswers;
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
            const opacity = optionAnims[i] ?? optionAnims[0];
            return (
              <Animated.View
                key={i}
                style={{
                  opacity: optionsVisible ? opacity : 0,
                  transform: [
                    {
                      translateY: opacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [12, 0],
                      }),
                    },
                  ],
                }}
              >
                <Pressable
                  onPress={() => onSelect(i)}
                  disabled={locked || !optionsVisible}
                  style={({ pressed }) => [
                    styles.option,
                    { backgroundColor: bg, borderColor: border, borderWidth: 2 },
                    pressed && !locked && optionsVisible && { opacity: 0.9 },
                    locked && isSelected && !reveal && styles.optionLocked,
                  ]}
                >
                  <Text style={styles.optionLetter}>{String.fromCharCode(65 + i)}</Text>
                  <Text style={styles.optionText}>{opt}</Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeGameStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
  soloTitle: {
    color: colors.text,
    fontSize: font.h2,
    fontWeight: '900',
    marginTop: spacing.md,
  },
  soloSub: {
    color: colors.textMuted,
    fontSize: font.body,
    marginBottom: spacing.md,
  },
  countdown: {
    color: colors.primary,
    fontSize: 96,
    fontWeight: '900',
  },
  countdownHint: {
    color: colors.textFaint,
    fontSize: font.small,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
  timedLabel: {
    color: colors.accent,
    fontSize: font.small,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  comboFlash: {
    color: colors.gold,
    fontSize: font.h3,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  qWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  options: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  optionsWait: {
    color: colors.textMuted,
    fontSize: font.small,
    fontWeight: '700',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  option: {
    minHeight: 52,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  optionLocked: {
    borderColor: colors.gold,
    borderWidth: 3,
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
}
