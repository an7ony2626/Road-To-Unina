import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { CompletedGameSummary, GameState, LeaderboardEntry } from '../models/game.model';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly http = inject(HttpClient);

  createGame(): Observable<GameState> {
    return this.http.post<GameState>('/api/games', {});
  }

  // GET /current returns 404 when there is no game in progress — that's
  // an expected state, not a failure, so it's translated to null here
  // rather than propagated as an error the caller has to catch.
  getCurrentGame(): Observable<GameState | null> {
    return this.http.get<GameState>('/api/games/current').pipe(
      catchError((err: HttpErrorResponse) => (err.status === 404 ? of(null) : (() => { throw err; })())),
    );
  }

  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>('/api/games/leaderboard');
  }

  getCompletedGames(): Observable<CompletedGameSummary[]> {
    return this.http.get<CompletedGameSummary[]>('/api/games/completed');
  }
}