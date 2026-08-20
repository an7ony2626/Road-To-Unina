export type GameStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export type GameFilterMode = 'ALL' | 'RANDOM' | 'CUSTOM' | 'UNINA';

export const GAME_FILTER_OPTIONS: { mode: GameFilterMode; label: string }[] = [
  { mode: 'ALL', label: 'Tutte' },
  { mode: 'RANDOM', label: 'Casuali' },
  { mode: 'CUSTOM', label: 'Personalizzate' },
  { mode: 'UNINA', label: 'Road to Unina' },
];

export interface GameStep {
  stepNumber: number;
  pageTitle: string;
}

export interface GameState {
  elapsedSeconds: number;
  gameId: number;
  startPageTitle: string;
  targetPageTitle: string;
  status: GameStatus;
  moves: number;
  currentPageTitle: string;
  currentPageContent: string;
  availableLinks: string[];
  path: GameStep[];
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  gamesCompleted: number;
  bestMoves: number | null;
}

export type LeaderboardSortMode = 'BEST_MOVES' | 'GAMES_PLAYED';

export interface LeaderboardPage {
  entries: LeaderboardEntry[];
  hasMore: boolean;
  currentUserRank: number | null;
}

export interface CompletedGameSummary {
  gameId: number;
  username: string;
  startPageTitle: string;
  targetPageTitle: string;
  moves: number;
  totalTimeSeconds: number;
  isRandomChallenge: boolean;
}

export interface CompletedGameDetail extends CompletedGameSummary {
  path: GameStep[];
}

export interface CompletedGamesPage {
  games: CompletedGameSummary[];
  hasMore: boolean;
}

export interface DuplicateGameError {
  message: string;
  existingGameId: number;
  existingMoves: number;
}