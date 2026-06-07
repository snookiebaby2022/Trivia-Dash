import { AVATAR_PRESETS } from './avatars';
import { makeBot } from './ghost';
import type { AvatarConfig, BotDifficulty, Competitor, GhostConfig, PartyPlayer, Profile } from '../types';

export const QUAD_SIZE = 4;
export const QUAD_QUESTIONS = 7;

export function buildOfflineQuad(profile: Profile, difficulty: BotDifficulty): Competitor[] {
  const you: Competitor = {
    id: profile.id,
    name: profile.username,
    avatar: profile.avatar,
    isBot: false,
    isYou: true,
    score: 0,
  };

  const bots: Competitor[] = Array.from({ length: 3 }, (_, i) => {
    const ghost = makeBot(difficulty, i);
    return ghostToCompetitor(ghost, `bot_${i}`, i + 1);
  });

  return [you, ...bots];
}

export function buildQuadFromLobby(
  profile: Profile,
  humans: PartyPlayer[],
  difficulty: BotDifficulty
): Competitor[] {
  const competitors: Competitor[] = humans.map((p) => ({
    id: p.playerId,
    name: p.username,
    avatar: p.avatar,
    isBot: false,
    isYou: p.playerId === profile.id,
    score: 0,
    elo: p.elo,
  }));

  const botsNeeded = QUAD_SIZE - competitors.length;
  for (let i = 0; i < botsNeeded; i++) {
    const ghost = makeBot(difficulty, i + competitors.length);
    competitors.push(ghostToCompetitor(ghost, `bot_fill_${i}`, i + 100));
  }

  return competitors.slice(0, QUAD_SIZE);
}

function ghostToCompetitor(ghost: GhostConfig, id: string, avatarIndex: number): Competitor {
  const avatar = AVATAR_PRESETS[avatarIndex % AVATAR_PRESETS.length];
  return {
    id,
    name: ghost.name,
    avatar,
    isBot: true,
    isYou: false,
    score: 0,
    ghost: { ...ghost },
    elo: ghost.elo,
  };
}

export function sortStandings(competitors: Competitor[]) {
  return [...competitors]
    .sort((a, b) => b.score - a.score)
    .map((c, i) => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      score: c.score,
      rank: i + 1,
      isYou: c.isYou,
      isBot: c.isBot,
    }));
}
