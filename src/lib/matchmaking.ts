import type { RealtimeChannel } from '@supabase/supabase-js';

import { avatarKey, normalizeAvatar, parseAvatarKey } from './avatars';
import { isSupabaseConfigured, supabase } from './supabase';
import type { AvatarConfig, OnlineMatch, OpponentInfo, PartyLobby, PartyPlayer, Profile } from '../types';

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function rowToPlayer(row: Record<string, unknown>, hostId: string): PartyPlayer {
  return {
    playerId: row.player_id as string,
    username: row.username as string,
    avatar: normalizeAvatar({
      emoji: row.avatar_emoji as string,
      color: row.avatar_color as string,
    }),
    elo: row.elo as number,
    score: (row.score as number) ?? 0,
    ready: Boolean(row.ready),
    isHost: row.player_id === hostId,
  };
}

export async function createPartyLobby(profile: Profile, maxPlayers = 6): Promise<PartyLobby | null> {
  if (!supabase) return null;
  const code = randomCode();
  const seed = Math.floor(Math.random() * 1e9);

  const { data: lobby, error } = await supabase
    .from('party_lobbies')
    .insert({
      code,
      host_id: profile.id,
      question_seed: seed,
      max_players: maxPlayers,
      status: 'waiting',
    })
    .select('*')
    .single();

  if (error || !lobby) return null;

  await supabase.from('party_players').insert({
    lobby_id: lobby.id,
    player_id: profile.id,
    username: profile.username,
    avatar_emoji: profile.avatar.emoji,
    avatar_color: profile.avatar.color,
    elo: profile.elo,
    ready: true,
  });

  return fetchPartyLobby(lobby.id);
}

export async function joinPartyByCode(profile: Profile, code: string): Promise<PartyLobby | null> {
  if (!supabase) return null;

  const { data: lobby } = await supabase
    .from('party_lobbies')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('status', 'waiting')
    .maybeSingle();

  if (!lobby) return null;

  const { count } = await supabase
    .from('party_players')
    .select('*', { count: 'exact', head: true })
    .eq('lobby_id', lobby.id);

  if ((count ?? 0) >= lobby.max_players) return null;

  await supabase.from('party_players').upsert({
    lobby_id: lobby.id,
    player_id: profile.id,
    username: profile.username,
    avatar_emoji: profile.avatar.emoji,
    avatar_color: profile.avatar.color,
    elo: profile.elo,
    ready: false,
  });

  return fetchPartyLobby(lobby.id);
}

export async function fetchPartyLobby(lobbyId: string): Promise<PartyLobby | null> {
  if (!supabase) return null;

  const { data: lobby } = await supabase.from('party_lobbies').select('*').eq('id', lobbyId).maybeSingle();
  if (!lobby) return null;

  const { data: players } = await supabase
    .from('party_players')
    .select('*')
    .eq('lobby_id', lobbyId)
    .order('joined_at', { ascending: true });

  return {
    id: lobby.id,
    code: lobby.code,
    hostId: lobby.host_id,
    status: lobby.status,
    questionSeed: lobby.question_seed,
    maxPlayers: lobby.max_players,
    players: (players ?? []).map((p) => rowToPlayer(p, lobby.host_id)),
  };
}

export async function setPartyReady(lobbyId: string, playerId: string, ready: boolean): Promise<void> {
  if (!supabase) return;
  await supabase.from('party_players').update({ ready }).eq('lobby_id', lobbyId).eq('player_id', playerId);
}

export async function startPartyLobby(
  lobbyId: string,
  hostId: string,
  minReady = 2
): Promise<boolean> {
  if (!supabase) return false;
  const lobby = await fetchPartyLobby(lobbyId);
  if (!lobby || lobby.hostId !== hostId) return false;
  const readyCount = lobby.players.filter((p) => p.ready).length;
  if (readyCount < minReady) return false;

  const { error } = await supabase
    .from('party_lobbies')
    .update({ status: 'playing' })
    .eq('id', lobbyId)
    .eq('status', 'waiting');

  return !error;
}

export function subscribePartyLobby(
  lobbyId: string,
  onUpdate: (lobby: PartyLobby | null) => void
): RealtimeChannel | null {
  if (!supabase) return null;

  const channel = supabase
    .channel(`party:${lobbyId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'party_lobbies', filter: `id=eq.${lobbyId}` },
      () => {
        void fetchPartyLobby(lobbyId).then(onUpdate);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'party_players', filter: `lobby_id=eq.${lobbyId}` },
      () => {
        void fetchPartyLobby(lobbyId).then(onUpdate);
      }
    )
    .subscribe();

  void fetchPartyLobby(lobbyId).then(onUpdate);
  return channel;
}

export async function leavePartyLobby(lobbyId: string, playerId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('party_players').delete().eq('lobby_id', lobbyId).eq('player_id', playerId);
}

/** Quick-match queue: pair with a waiting human or return null to fall back to ghost. */
export async function joinQuickMatchQueue(profile: Profile, timeoutMs = 12000): Promise<OnlineMatch | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  const cutoff = new Date(Date.now() - 60000).toISOString();

  const { data: waiting } = await supabase
    .from('match_queue')
    .select('*')
    .neq('player_id', profile.id)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const seed = Math.floor(Math.random() * 1e9);

  if (waiting) {
    await supabase.from('match_queue').delete().eq('id', waiting.id);

    const opponent: OpponentInfo = {
      id: waiting.player_id,
      name: waiting.username,
      avatar: normalizeAvatar({
        emoji: waiting.avatar_emoji,
        color: waiting.avatar_color,
      }),
      elo: waiting.elo,
      isHuman: true,
    };

    const { data: match } = await supabase
      .from('active_matches')
      .insert({
        player_a_id: waiting.player_id,
        player_b_id: profile.id,
        player_a_name: waiting.username,
        player_b_name: profile.username,
        player_a_avatar: avatarKey(opponent.avatar),
        player_b_avatar: avatarKey(profile.avatar),
        player_a_elo: waiting.elo,
        player_b_elo: profile.elo,
        question_seed: seed,
        status: 'playing',
        mode: 'quick',
      })
      .select('*')
      .single();

    if (!match) return null;

    return {
      id: match.id,
      questionSeed: match.question_seed,
      opponent,
    };
  }

  const { data: queued } = await supabase
    .from('match_queue')
    .insert({
      player_id: profile.id,
      username: profile.username,
      avatar_emoji: profile.avatar.emoji,
      avatar_color: profile.avatar.color,
      elo: profile.elo,
    })
    .select('*')
    .single();

  if (!queued) return null;

  return new Promise((resolve) => {
    let resolved = false;
    const finish = (result: OnlineMatch | null) => {
      if (resolved) return;
      resolved = true;
      channel?.unsubscribe();
      clearTimeout(timer);
      resolve(result);
    };

    const channel = supabase!
      .channel(`queue:${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'active_matches' },
        async (payload) => {
          const row = payload.new as Record<string, unknown>;
          const isPlayer =
            row.player_a_id === profile.id || row.player_b_id === profile.id;
          if (!isPlayer) return;

          await supabase!.from('match_queue').delete().eq('player_id', profile.id);

          const isA = row.player_a_id === profile.id;
          const opponent: OpponentInfo = {
            id: isA ? (row.player_b_id as string) : (row.player_a_id as string),
            name: isA ? (row.player_b_name as string) : (row.player_a_name as string),
            avatar: parseAvatarFromRow(isA ? row.player_b_avatar : row.player_a_avatar),
            elo: isA ? (row.player_b_elo as number) : (row.player_a_elo as number),
            isHuman: true,
          };

          finish({
            id: row.id as string,
            questionSeed: row.question_seed as number,
            opponent,
          });
        }
      )
      .subscribe();

    const timer = setTimeout(async () => {
      await supabase!.from('match_queue').delete().eq('player_id', profile.id);
      finish(null);
    }, timeoutMs);
  });
}

function parseAvatarFromRow(value: unknown): AvatarConfig {
  if (typeof value === 'string') {
    const parts = value.split(':');
    if (parts.length >= 4) return parseAvatarKey(value);
    if (parts.length >= 2) return normalizeAvatar({ emoji: parts[0], color: parts[1] });
  }
  return normalizeAvatar({ emoji: '🤖', color: '#7C5CFF' });
}

export function subscribeOnlineMatch(
  matchId: string,
  profileId: string,
  onUpdate: (scores: { you: number; opponent: number; opponentName: string }) => void
): RealtimeChannel | null {
  if (!supabase) return null;

  const apply = (row: Record<string, unknown>) => {
    const isA = row.player_a_id === profileId;
    onUpdate({
      you: isA ? (row.player_a_score as number) : (row.player_b_score as number),
      opponent: isA ? (row.player_b_score as number) : (row.player_a_score as number),
      opponentName: isA ? (row.player_b_name as string) : (row.player_a_name as string),
    });
  };

  return supabase
    .channel(`match:${matchId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'active_matches', filter: `id=eq.${matchId}` },
      (payload) => apply(payload.new as Record<string, unknown>)
    )
    .subscribe();
}

export async function reportOnlineScore(
  matchId: string,
  profileId: string,
  score: number,
  round: number
): Promise<void> {
  if (!supabase) return;

  const { data: match } = await supabase.from('active_matches').select('*').eq('id', matchId).maybeSingle();
  if (!match) return;

  const isA = match.player_a_id === profileId;
  await supabase
    .from('active_matches')
    .update(
      isA
        ? { player_a_score: score, player_a_round: round }
        : { player_b_score: score, player_b_round: round }
    )
    .eq('id', matchId);
}

export async function reportPartyScore(lobbyId: string, playerId: string, score: number): Promise<void> {
  if (!supabase) return;
  await supabase.from('party_players').update({ score }).eq('lobby_id', lobbyId).eq('player_id', playerId);
}

export function isMatchmakingAvailable(): boolean {
  return isSupabaseConfigured;
}
