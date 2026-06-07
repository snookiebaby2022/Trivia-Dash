import type { RealtimeChannel } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from './supabase';
import type { PartyReaction } from '../types';

const REACTION_EMOJIS = ['🔥', '👏', '😱', '💀', '🎉', '🤯'] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export { REACTION_EMOJIS };

let reactionChannel: RealtimeChannel | null = null;

export function subscribePartyReactions(
  lobbyId: string,
  onReaction: (reaction: PartyReaction) => void
): (() => void) | null {
  if (!supabase || !isSupabaseConfigured) return null;

  reactionChannel?.unsubscribe();
  reactionChannel = supabase
    .channel(`party-reactions:${lobbyId}`)
    .on('broadcast', { event: 'reaction' }, ({ payload }) => {
      const p = payload as PartyReaction;
      if (p?.emoji) onReaction(p);
    })
    .subscribe();

  return () => {
    reactionChannel?.unsubscribe();
    reactionChannel = null;
  };
}

export async function sendPartyReaction(
  lobbyId: string,
  playerId: string,
  playerName: string,
  emoji: ReactionEmoji
): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;

  const channel =
    reactionChannel ??
    supabase.channel(`party-reactions:${lobbyId}`).subscribe();

  await channel.send({
    type: 'broadcast',
    event: 'reaction',
    payload: {
      id: `${playerId}-${Date.now()}`,
      playerId,
      playerName,
      emoji,
      at: Date.now(),
    } satisfies PartyReaction,
  });
}

export function makeLocalReaction(
  playerId: string,
  playerName: string,
  emoji: ReactionEmoji
): PartyReaction {
  return {
    id: `${playerId}-${Date.now()}`,
    playerId,
    playerName,
    emoji,
    at: Date.now(),
  };
}
