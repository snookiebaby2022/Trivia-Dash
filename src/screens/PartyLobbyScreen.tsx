import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarView } from '../components/AvatarView';
import { PrimaryButton } from '../components/PrimaryButton';
import { useProfile } from '../context/ProfileContext';
import {
  createPartyLobby,
  fetchPartyLobby,
  isMatchmakingAvailable,
  joinPartyByCode,
  leavePartyLobby,
  setPartyReady,
  startPartyLobby,
  subscribePartyLobby,
} from '../lib/matchmaking';
import { buildQuadFromLobby } from '../lib/quad';
import type { RootStackParamList } from '../navigation';
import { colors, font, radius, spacing } from '../theme';
import type { BotDifficulty, PartyLobby, PartyPlayer } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PartyLobby'>;

export function PartyLobbyScreen({ navigation, route }: Props) {
  const { profile } = useProfile();
  const [lobby, setLobby] = useState<PartyLobby | null>(null);
  const [joinCode, setJoinCode] = useState(route.params?.joinCode ?? '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    let channel: ReturnType<typeof subscribePartyLobby> = null;

    const boot = async () => {
      setLoading(true);
      setError(null);

      if (route.params?.lobbyId) {
        const existing = await fetchPartyLobby(route.params.lobbyId);
        if (existing) {
          setLobby(existing);
          channel = subscribePartyLobby(existing.id, setLobby);
          setLoading(false);
          return;
        }
      }

      if (route.params?.joinCode) {
        const joined = await joinPartyByCode(profile, route.params.joinCode);
        if (joined) {
          setLobby(joined);
          channel = subscribePartyLobby(joined.id, setLobby);
        } else {
          setError('Party room not found or full');
        }
        setLoading(false);
        return;
      }

      if (route.params?.host && isMatchmakingAvailable()) {
        const maxPlayers = route.params?.quad ? 4 : 6;
        const created = await createPartyLobby(profile, maxPlayers);
        if (created) {
          setLobby(created);
          channel = subscribePartyLobby(created.id, setLobby);
        } else {
          setError('Could not create party room — check Supabase');
        }
        setLoading(false);
        return;
      }

      // Join flow — show code entry UI
      setLoading(false);
    };

    void boot();

    return () => {
      channel?.unsubscribe();
      if (lobby && profile) void leavePartyLobby(lobby.id, profile.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const me = lobby?.players.find((p) => p.playerId === profile?.id);
  const isHost = me?.isHost ?? false;
  const readyCount = lobby?.players.filter((p) => p.ready).length ?? 0;

  const onJoinManual = async () => {
    if (!profile || !joinCode.trim()) return;
    setLoading(true);
    const joined = await joinPartyByCode(profile, joinCode.trim());
    if (joined) {
      setLobby(joined);
      subscribePartyLobby(joined.id, setLobby);
      setError(null);
    } else {
      setError('Invalid code or room full');
    }
    setLoading(false);
  };

  const isQuad = route.params?.quad ?? false;
  const botDifficulty: BotDifficulty = route.params?.botDifficulty ?? 'medium';

  useEffect(() => {
    if (!lobby || !profile || lobby.status !== 'playing' || !isQuad) return;
    if (lobby.hostId === profile.id) return; // host navigates from onStart

    const competitors = buildQuadFromLobby(profile, lobby.players, botDifficulty);
    navigation.replace('QuadGame', {
      competitors,
      questionSeed: lobby.questionSeed,
      lobbyId: lobby.id,
      botDifficulty,
      isOnline: true,
    });
  }, [lobby?.status, lobby?.id, profile, isQuad, botDifficulty, navigation, lobby]);

  const onStart = async () => {
    if (!lobby || !profile) return;
    const minReady = isQuad ? 1 : 2;
    const readyCountNow = lobby.players.filter((p) => p.ready).length;
    if (readyCountNow < minReady) {
      setError(isQuad ? 'At least you must be ready' : 'Need at least 2 ready players');
      return;
    }

    const ok = await startPartyLobby(lobby.id, profile.id, isQuad ? 1 : 2);
    if (!ok) {
      setError('Could not start — try again');
      return;
    }

    const updated = await fetchPartyLobby(lobby.id);
    if (!updated) return;

    if (isQuad) {
      const competitors = buildQuadFromLobby(profile, updated.players, botDifficulty);
      navigation.replace('QuadGame', {
        competitors,
        questionSeed: updated.questionSeed,
        lobbyId: updated.id,
        botDifficulty,
        isOnline: true,
      });
      return;
    }

    const rival = updated.players.find((p) => p.playerId !== profile.id);
    navigation.replace('Game', {
      mode: 'party',
      lobbyId: updated.id,
      questionSeed: updated.questionSeed,
      partySize: updated.players.length,
      opponent: rival
        ? {
            id: rival.playerId,
            name: rival.username,
            avatar: rival.avatar,
            elo: rival.elo,
            isHuman: true,
          }
        : undefined,
      isOnline: true,
    });
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!lobby) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Text style={styles.title}>Join a Party 🎉</Text>
        <Text style={styles.sub}>Enter a 4-letter room code from your host</Text>
        <TextInput
          value={joinCode}
          onChangeText={(t) => setJoinCode(t.toUpperCase())}
          maxLength={4}
          autoCapitalize="characters"
          placeholder="ABCD"
          placeholderTextColor={colors.textFaint}
          style={styles.codeInput}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <PrimaryButton label="Join Party" onPress={onJoinManual} />
        <PrimaryButton label="Back" variant="ghost" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Text style={styles.title}>{isQuad ? '4-Player Lobby 🎲' : 'Party Lobby 🎉'}</Text>
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>ROOM CODE</Text>
        <Text style={styles.code}>{lobby.code}</Text>
        <Text style={styles.codeHint}>Share with friends on the couch or online</Text>
      </View>

      <Text style={styles.section}>Players ({lobby.players.length}/{lobby.maxPlayers})</Text>
      <View style={styles.playerList}>
        {lobby.players.map((p) => (
          <PlayerRow key={p.playerId} player={p} isYou={p.playerId === profile.id} />
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        <PrimaryButton
          label={me?.ready ? 'Not Ready' : 'Ready Up ✓'}
          variant={me?.ready ? 'ghost' : 'primary'}
          onPress={() => void setPartyReady(lobby.id, profile.id, !me?.ready).then(() => fetchPartyLobby(lobby.id).then(setLobby))}
        />
        {isHost && (
          <PrimaryButton
            label={
              isQuad
                ? `Start 4-Player (${readyCount} ready · bots fill rest)`
                : `Start Party (${readyCount} ready)`
            }
            variant="accent"
            onPress={onStart}
          />
        )}
        <PrimaryButton label="Leave" variant="ghost" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

function PlayerRow({ player, isYou }: { player: PartyPlayer; isYou: boolean }) {
  return (
    <View style={[styles.playerRow, isYou && styles.playerYou]}>
      <AvatarView avatar={player.avatar} size={44} showRing={player.ready} />
      <View style={{ flex: 1 }}>
        <Text style={styles.playerName}>
          {player.username}
          {player.isHost ? ' 👑' : ''}
          {isYou ? ' (you)' : ''}
        </Text>
        <Text style={styles.playerMeta}>{player.elo} ELO</Text>
      </View>
      <Text style={styles.readyBadge}>{player.ready ? '✓ Ready' : '…'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: font.h1,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  sub: {
    color: colors.textMuted,
    fontSize: font.body,
    marginBottom: spacing.lg,
  },
  codeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  codeLabel: {
    color: colors.textFaint,
    fontSize: font.small,
    fontWeight: '800',
    letterSpacing: 2,
  },
  code: {
    color: colors.accent,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 8,
    marginVertical: spacing.sm,
  },
  codeHint: {
    color: colors.textMuted,
    fontSize: font.small,
    textAlign: 'center',
  },
  section: {
    color: colors.textMuted,
    fontSize: font.body,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  playerList: { gap: spacing.sm, flex: 1 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  playerYou: { borderColor: colors.primary },
  playerName: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '800',
  },
  playerMeta: {
    color: colors.textFaint,
    fontSize: font.small,
  },
  readyBadge: {
    color: colors.success,
    fontSize: font.small,
    fontWeight: '800',
  },
  codeInput: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 8,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  error: {
    color: colors.danger,
    fontSize: font.small,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  actions: { gap: spacing.sm, paddingVertical: spacing.md },
});
