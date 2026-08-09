import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { CompletedGameDetail, CompletedGameSummary, GameState, LeaderboardEntry } from '../models/game.model';
import { environment } from '../../environments/environments';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly http = inject(HttpClient);

  createGame(startPageTitle?: string, targetPageTitle?: string): Observable<GameState> {
    return this.http.post<GameState>(`${environment.apiUrl}/games`, { startPageTitle, targetPageTitle });
  }

  // GET /current returns 404 when there is no game in progress — that's
  // an expected state, not a failure, so it's translated to null here
  // rather than propagated as an error the caller has to catch.
  getCurrentGame(): Observable<GameState | null> {
    return this.http.get<GameState>(`${environment.apiUrl}/games/current`).pipe(
      catchError((err: HttpErrorResponse) => (err.status === 404 ? of(null) : (() => { throw err; })())),
    );
  }

  getGame(id: number): Observable<GameState> {
    return this.http.get<GameState>(`${environment.apiUrl}/games/${id}`);
  }

  followLink(id: number, clickedTitle: string): Observable<GameState> {
    return this.http.post<GameState>(`${environment.apiUrl}/games/${id}/moves`, { clickedTitle });
  }

  abandonGame(id: number): Observable<GameState> {
    return this.http.patch<GameState>(`${environment.apiUrl}/games/${id}`, { status: 'ABANDONED' });
  }

  // Called on "Esci": freezes the server-side clock without abandoning
  // the game, so idle time away from the game isn't counted on resume.
  pauseGame(id: number): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/games/${id}/pause`, {});
  }

  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${environment.apiUrl}/games/leaderboard`);
  }

  getCompletedGames(): Observable<CompletedGameSummary[]> {
    return this.http.get<CompletedGameSummary[]>(`${environment.apiUrl}/games/completed`);
  }

  getCompletedGameDetail(id: number): Observable<CompletedGameDetail> {
    return this.http.get<CompletedGameDetail>(`${environment.apiUrl}/games/completed/${id}`);
  }
}