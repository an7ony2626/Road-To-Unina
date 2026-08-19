import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import {
  CompletedGameDetail,
  CompletedGamesPage,
  GameFilterMode,
  GameState,
  LeaderboardPage,
  LeaderboardSortMode,
} from '../models/game.model';
import { environment } from '../../environments/environments';

const COMPLETED_PAGE_SIZE = 10;
const LEADERBOARD_PAGE_SIZE = 10;

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly http = inject(HttpClient);

  createGame(
    startPageTitle?: string,
    targetPageTitle?: string,
    startWasRandom = false,
    targetWasRandom = false,
  ): Observable<GameState> {
    return this.http.post<GameState>(`${environment.apiUrl}/games`, {
      startPageTitle,
      targetPageTitle,
      startWasRandom,
      targetWasRandom,
    });
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

  pauseGame(id: number): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/games/${id}/pause`, {});
  }

  getLeaderboard(
    mode: GameFilterMode = 'ALL',
    sortBy: LeaderboardSortMode = 'BEST_MOVES',
    page = 0,
    size = LEADERBOARD_PAGE_SIZE,
  ): Observable<LeaderboardPage> {
    const params = new HttpParams().set('mode', mode).set('sortBy', sortBy).set('page', page).set('size', size);
    return this.http.get<LeaderboardPage>(`${environment.apiUrl}/games/leaderboard`, { params });
  }

  getCompletedGames(
    mode: GameFilterMode = 'ALL',
    page = 0,
    size = COMPLETED_PAGE_SIZE,
  ): Observable<CompletedGamesPage> {
    const params = new HttpParams().set('mode', mode).set('page', page).set('size', size);
    return this.http.get<CompletedGamesPage>(`${environment.apiUrl}/games/completed`, { params });
  }

  getCompletedGameDetail(id: number): Observable<CompletedGameDetail> {
    return this.http.get<CompletedGameDetail>(`${environment.apiUrl}/games/completed/${id}`);
  }
}