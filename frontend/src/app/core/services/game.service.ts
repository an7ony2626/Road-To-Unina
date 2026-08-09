import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { CompletedGameDetail, CompletedGameSummary, GameState, LeaderboardEntry } from '../models/game.model';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly http = inject(HttpClient);

  createGame(startPageTitle?: string, targetPageTitle?: string): Observable<GameState> {
    return this.http.post<GameState>('/api/games', { startPageTitle, targetPageTitle });
  }

  getCurrentGame(): Observable<GameState | null> {
    return this.http.get<GameState>('/api/games/current').pipe(
      catchError((err: HttpErrorResponse) => (err.status === 404 ? of(null) : (() => { throw err; })())),
    );
  }

  getGame(id: number): Observable<GameState> {
    return this.http.get<GameState>(`/api/games/${id}`);
  }

  followLink(id: number, clickedTitle: string): Observable<GameState> {
    return this.http.post<GameState>(`/api/games/${id}/moves`, { clickedTitle });
  }

  abandonGame(id: number): Observable<GameState> {
    return this.http.patch<GameState>(`/api/games/${id}`, { status: 'ABANDONED' });
  }

  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>('/api/games/leaderboard');
  }

  getCompletedGames(): Observable<CompletedGameSummary[]> {
    return this.http.get<CompletedGameSummary[]>('/api/games/completed');
  }

  getCompletedGameDetail(id: number): Observable<CompletedGameDetail> {
    return this.http.get<CompletedGameDetail>(`/api/games/completed/${id}`);
  }
}