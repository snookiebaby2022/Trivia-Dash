import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { track } from '../lib/analytics';
import { addCoins } from '../lib/coins';
import { saveProfile } from '../lib/storage';
import { syncProfile } from '../lib/leaderboard';
import type { RootStackParamList } from '../navigation';
import type { ThemeColors } from '../theme';
import { font, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Tournament'>;

interface TournamentMatch {
  id: string;
  round: number;
  player1: string;
  player2: string;
  score1: number;
  score2: number;
  winner: string;
  isPlayer: boolean;
}

interface TournamentBracket {
  id: string;
  name: string;
  entryFee: number;
  prizeCoins: number;
  status: 'registering' | 'in_progress' | 'completed';
  currentRound: number;
  totalRounds: number;
  matches: TournamentMatch[];
  playerNames: string[];
}

const ENTRY_FEE = 100;
const PRIZE_COINS = 500;
const BOT_NAMES = ['QuizBot Alpha', 'TriviaPro99', 'BrainStorm', 'FactMaster', 'QuizWhiz', 'KnowledgeKing'];

function generateBracket(playerName: string): TournamentBracket {
  const shuffled = [...BOT_NAMES].sort(() => Math.random() - 0.5);
  const players = [playerName, ...shuffled.slice(0, 7)];
  const shuffledPlayers = players.sort(() => Math.random() - 0.5);

  const matches: TournamentMatch[] = [];
  let round = 1;

  for (let i = 0; i < shuffledPlayers.length; i += 2) {
    const p1 = shuffledPlayers[i];
    const p2 = shuffledPlayers[i + 1] ?? 'BYE';
    if (p2 === 'BYE') {
      matches.push({
        id: `r${round}_${i}`,
        round,
        player1: p1,
        player2: p2,
        score1: 7,
        score2: 0,
        winner: p1,
        isPlayer: p1 === playerName,
      });
    } else {
      const isPlayer = p1 === playerName || p2 === playerName;
      const score1 = isPlayer ? Math.floor(Math.random() * 4) + 4 : Math.floor(Math.random() * 7);
      const score2 = isPlayer ? Math.floor(Math.random() * 4) + 4 : Math.floor(Math.random() * 7);
      const winner = score1 >= score2 ? p1 : p2;
      matches.push({
        id: `r${round}_${i}`,
        round,
        player1: p1,
        player2: p2,
        score1,
        score2,
        winner,
        isPlayer,
      });
    }
    round++;
  }

  // Generate later rounds
  for (let r = 2; r <= 3; r++) {
    const prevRoundMatches = matches.filter((m) => m.round === r - 1);
    for (let i = 0; i < prevRoundMatches.length; i += 2) {
      const w1 = prevRoundMatches[i]?.winner ?? 'BYE';
      const w2 = prevRoundMatches[i + 1]?.winner ?? 'BYE';
      if (w2 === 'BYE') {
        matches.push({ id: `r${r}_${i}`, round: r, player1: w1, player2: w2, score1: 7, score2: 0, winner: w1, isPlayer: w1 === playerName });
      } else {
        const isPlayer = w1 === playerName || w2 === playerName;
        const score1 = isPlayer ? Math.floor(Math.random() * 4) + 4 : Math.floor(Math.random() * 7);
        const score2 = isPlayer ? Math.floor(Math.random() * 4) + 4 : Math.floor(Math.random() * 7);
        matches.push({ id: `r${r}_${i}`, round: r, player1: w1, player2: w2, score1, score2, winner: score1 >= score2 ? w1 : w2, isPlayer });
      }
    }
  }

  return {
    id: `t_${Date.now()}`,
    name: 'Trivia Championship',
    entryFee: ENTRY_FEE,
    prizeCoins: PRIZE_COINS,
    status: 'completed',
    currentRound: 3,
    totalRounds: 3,
    matches,
    playerNames: players,
  };
}

export function TournamentScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { profile, update } = useProfile();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [bracket, setBracket] = useState<TournamentBracket | null>(null);

  if (!profile) return null;

  const coins = profile.coins ?? 0;

  const joinTournament = () => {
    if (coins < ENTRY_FEE) {
      Alert.alert('Not enough coins', `You need ${ENTRY_FEE} coins to enter.`);
      return;
    }

    track({ type: 'tournament_joined', timestamp: Date.now() });

    const newProfile = addCoins(profile, -ENTRY_FEE);
    void update(newProfile);

    const b = generateBracket(profile.username);
    setBracket(b);

    const won = b.matches.some((m) => m.isPlayer && m.winner === profile.username);
    const placement = won ? 1 : Math.floor(Math.random() * 4) + 2;

    if (won) {
      const prizeProfile = addCoins(newProfile, PRIZE_COINS);
      void update(prizeProfile);
      Alert.alert('Tournament Champion!', `You won ${PRIZE_COINS} coins!`);
      track({ type: 'tournament_completed', placement: 1, timestamp: Date.now() });
    } else {
      Alert.alert('Tournament Over', `You placed #${placement}. Better luck next time!`);
      track({ type: 'tournament_completed', placement, timestamp: Date.now() });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Tournament</Text>

        {!bracket ? (
          <View style={styles.card}>
            <Text style={styles.cardEmoji}>🏆</Text>
            <Text style={styles.cardTitle}>Trivia Championship</Text>
            <Text style={styles.cardDesc}>
              Compete in a bracket tournament against 7 opponents. Win the final to claim the prize!
            </Text>
            <View style={styles.prizesRow}>
              <View style={styles.prizeItem}>
                <Text style={styles.prizeLabel}>Entry Fee</Text>
                <Text style={styles.prizeValue}>🪙 {ENTRY_FEE}</Text>
              </View>
              <View style={styles.prizeItem}>
                <Text style={styles.prizeLabel}>Prize</Text>
                <Text style={[styles.prizeValue, { color: colors.gold }]}>🪙 {PRIZE_COINS}</Text>
              </View>
            </View>
            <PrimaryButton
              label={coins >= ENTRY_FEE ? `Join — 🪙 ${ENTRY_FEE}` : 'Not enough coins'}
              variant="accent"
              disabled={coins < ENTRY_FEE}
              onPress={joinTournament}
            />
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bracket Complete</Text>
            {[1, 2, 3].map((round) => {
              const roundMatches = bracket.matches.filter((m) => m.round === round);
              return (
                <View key={round} style={styles.roundSection}>
                  <Text style={styles.roundLabel}>Round {round}</Text>
                  {roundMatches.map((m) => (
                    <View key={m.id} style={[styles.matchRow, m.isPlayer && styles.matchRowPlayer]}>
                      <Text style={[styles.playerName, m.winner === m.player1 && styles.winner]}>{m.player1}</Text>
                      <Text style={styles.score}>{m.score1} - {m.score2}</Text>
                      <Text style={[styles.playerName, m.winner === m.player2 && styles.winner]}>{m.player2}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
            <PrimaryButton
              label="Play again"
              variant="primary"
              onPress={() => {
                setBracket(null);
              }}
            />
          </View>
        )}

        <PrimaryButton
          label="Back to Home"
          variant="ghost"
          onPress={() => navigation.navigate('Home')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    title: { color: colors.gold, fontSize: font.h2, fontWeight: '900', textAlign: 'center' },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.md,
    },
    cardEmoji: { fontSize: 48 },
    cardTitle: { color: colors.text, fontSize: font.h2, fontWeight: '900', textAlign: 'center' },
    cardDesc: { color: colors.textMuted, fontSize: font.body, textAlign: 'center' },
    prizesRow: { flexDirection: 'row', gap: spacing.lg, marginVertical: spacing.sm },
    prizeItem: { alignItems: 'center' },
    prizeLabel: { color: colors.textMuted, fontSize: font.small, fontWeight: '700' },
    prizeValue: { color: colors.text, fontSize: font.h3, fontWeight: '900' },
    roundSection: { width: '100%', gap: spacing.sm, marginBottom: spacing.md },
    roundLabel: { color: colors.primary, fontSize: font.body, fontWeight: '900', textAlign: 'center' },
    matchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgElevated,
      borderRadius: radius.sm,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    matchRowPlayer: { borderColor: colors.gold, borderWidth: 1 },
    playerName: { flex: 1, color: colors.textMuted, fontSize: font.small, fontWeight: '700' },
    winner: { color: colors.success, fontWeight: '900' },
    score: { color: colors.text, fontSize: font.body, fontWeight: '900' },
  });
}
