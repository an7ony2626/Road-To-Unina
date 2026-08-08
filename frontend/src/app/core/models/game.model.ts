// Mirrors backend DTOs 1:1 (it.unina.demo.dto.response / entity.GameStatus).

export type GameStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export interface GameStep {
  stepNumber: number;
  pageTitle: string;
}

export interface GameState {
  startedAt: string | number | Date;
  gameId: number;
  startPageTitle: string;
  targetPageTitle: string;
  status: GameStatus;
  numSteps: number;
  currentPageTitle: string;
  currentPageContent: string;
  availableLinks: string[];
  path: GameStep[];
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  gamesCompleted: number;
  bestSteps: number | null;
}

export interface CompletedGameSummary {
  gameId: number;
  username: string;
  startPageTitle: string;
  targetPageTitle: string;
  numSteps: number;
  totalTimeSeconds: number;
}