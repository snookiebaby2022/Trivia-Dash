import type {
  BotDifficulty,
  Category,
  Competitor,
  MatchMode,
  MatchSummary,
  OpponentInfo,
  PassPlayPlayer,
} from './types';

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Achievements: undefined;
  WedgeProfile: { category?: Category } | undefined;
  CategoryPractice: { category?: Category } | undefined;
  SeasonPass: undefined;
  FriendParty: undefined;
  DailyLeaderboard: undefined;
  UgcPacks: undefined;
  VoicePacks: undefined;
  UnlockFeatures: undefined;
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
    category?: Category;
    botDifficulty?: BotDifficulty;
    friendCode?: string;
    ugcPackId?: string;
    ugcPackTitle?: string;
  };
  Result: { summary: MatchSummary };
  Leaderboard: undefined;
  CoinShop: undefined;
  Stats: undefined;
  Tournament: undefined;
  Friends: undefined;
  LiveHost: undefined;
  PackBuilder: undefined;
  MatchReplay: { summary: MatchSummary };
};
