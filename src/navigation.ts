import type {
  BotDifficulty,
  Competitor,
  MatchMode,
  MatchSummary,
  OpponentInfo,
  PassPlayPlayer,
} from './types';

export type RootStackParamList = {
  Home: undefined;
  Achievements: undefined;
  PassPlaySetup: undefined;
  PassPlayGame: {
    players: PassPlayPlayer[];
    questionSeed: number;
  };
  QuadSetup: undefined;
  QuadGame: {
    competitors: Competitor[];
    questionSeed: number;
    botDifficulty: BotDifficulty;
    lobbyId?: string;
    isOnline?: boolean;
  };
  PartyLobby:
    | {
        lobbyId?: string;
        joinCode?: string;
        host?: boolean;
        quad?: boolean;
        botDifficulty?: BotDifficulty;
      }
    | undefined;
  Game: {
    mode: MatchMode;
    questionSeed?: number;
    questionIds?: string[];
    matchId?: string;
    lobbyId?: string;
    opponent?: OpponentInfo;
    isOnline?: boolean;
    partySize?: number;
  };
  Result: { summary: MatchSummary };
  Leaderboard: undefined;
};
