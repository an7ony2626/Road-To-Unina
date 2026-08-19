import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, of, timeout } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { GameService } from '../../core/services/game.service';
import {
  CompletedGameSummary,
  DuplicateGameError,
  GameFilterMode,
  GameState,
  LeaderboardEntry,
  LeaderboardSortMode,
} from '../../core/models/game.model';
import { WikiSearchResult } from '../../core/models/wiki-search.model';
import { PageSearchComponent } from '../../shared/page-search/page-search.component';
import { AnimatedBackgroundComponent } from '../../shared/animated-background/animated-background.component';

const REQUEST_TIMEOUT_MS = 10_000;
// Both the leaderboard and completed-games panels on the home page show
// a short preview; the full lists live on their own "vedi tutte" pages.
const HOME_PREVIEW_SIZE = 5;

const FILTERS: { mode: GameFilterMode; label: string }[] = [
  { mode: 'ALL', label: 'Tutte' },
  { mode: 'RANDOM', label: 'Casuali' },
  { mode: 'CUSTOM', label: 'Personalizzate' },
  { mode: 'UNINA', label: 'Road to Unina' },
];

const SORT_OPTIONS: { sort: LeaderboardSortMode; label: string }[] = [
  { sort: 'BEST_MOVES', label: 'Per mosse' },
  { sort: 'GAMES_PLAYED', label: 'Per partite' },
];

@Component({
  selector: 'app-home',
  imports: [RouterLink, PageSearchComponent, AnimatedBackgroundComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'home.component.scss',
  template: `
    <div class="page">
      <app-animated-background />

      <header class="topbar">
        <span class="brand">WikiRace</span>
        <div class="topbar-actions">
          @if (auth.isAuthenticated()) {
            <span class="username">{{ auth.username() }}</span>
            <button type="button" class="link-button" (click)="logout()">Esci</button>
          } @else {
            <a routerLink="/login" class="link-button">Accedi</a>
            <a routerLink="/register" class="link-button">Registrati</a>
          }
        </div>
      </header>

      <main class="content">
        <section class="status-card">
          @if (!auth.isAuthenticated()) {
            <h1>Benvenuto su WikiRace</h1>
            <p class="muted">
              Accedi per avviare una sfida. Puoi comunque esplorare classifica e partite concluse qui sotto.
            </p>
          } @else {
            <svg class="route" viewBox="0 0 320 40" aria-hidden="true">
              <line
                x1="16" y1="20" x2="304" y2="20"
                stroke="var(--ink)"
                stroke-width="3"
                stroke-dasharray="4 8"
                stroke-linecap="round"
              />
              <circle [attr.cx]="progressX()" cy="20" r="10" fill="var(--wiki-blue)" />
              <circle cx="304" cy="20" r="10" fill="var(--route-red)" />
            </svg>

            @if (isLoadingCurrent()) {
              <p class="muted">Verifica partita in corso…</p>
            } @else if (currentLoadFailed()) {
              <p class="error">Impossibile verificare la partita in corso.</p>
              <button type="button" class="cta" (click)="loadCurrentGame()">Riprova</button>
            } @else if (currentGame()) {
              <h1>Sfida in corso</h1>
              <p class="route-labels">
                <strong>{{ currentGame()!.startPageTitle }}</strong>
                →
                <strong>{{ currentGame()!.targetPageTitle }}</strong>
              </p>
              <p class="muted">{{ currentGame()!.moves }} mosse fatte finora</p>
              <button type="button" class="cta" (click)="resumeGame()">Riprendi la sfida</button>
            } @else {
              <h1>Pronto per una sfida?</h1>
              <p class="muted">
                Lascia scegliere il caso, oppure imposta tu le pagine di partenza e arrivo.
              </p>

              <div class="page-picker">
                <app-page-search label="Pagina di partenza" (pageSelected)="onStartPageSelected($event)" />
                <span class="picker-arrow" aria-hidden="true">→</span>
                <app-page-search label="Pagina di arrivo" (pageSelected)="onTargetPageSelected($event)" />
              </div>

              @if (startErrorMessage()) {
                <p class="error">{{ startErrorMessage() }}</p>
              }

              <button type="button" class="cta" [disabled]="isStarting()" (click)="startGame()">
                {{ isStarting() ? 'Creazione…' : 'Inizia una nuova sfida' }}
              </button>
            }
          }
        </section>

        <section class="panel">
          <div class="panel-header">
            <div class="panel-title">
              <h2>Classifica</h2>

              <div class="toggle-switch">
                <div 
                  class="toggle-indicator" 
                  [class.right]="leaderboardSort() === 'GAMES_PLAYED'">
                </div>
                <button 
                  type="button" 
                  class="toggle-btn" 
                  [class.active]="leaderboardSort() === 'BEST_MOVES'"
                  (click)="selectLeaderboardSort('BEST_MOVES')">
                  Per mosse
                </button>
                <button 
                  type="button" 
                  class="toggle-btn" 
                  [class.active]="leaderboardSort() === 'GAMES_PLAYED'"
                  (click)="selectLeaderboardSort('GAMES_PLAYED')">
                  Per partite
                </button>
              </div>

              @if (leaderboardRank(); as rank) {
                <span class="rank-badge">{{ auth.username() }}: {{ rank }}°</span>
              }
            </div>

            <a routerLink="/leaderboard" class="link-button">Vedi tutte →</a>
          </div>

          <!-- Filtri tipologia di partita -->
          <div class="filter-bar">
            @for (filter of filters; track filter.mode) {
              <button
                type="button"
                class="filter-button"
                [class.active]="leaderboardMode() === filter.mode"
                (click)="selectLeaderboardMode(filter.mode)">
                {{ filter.label }}
              </button>
            }
          </div>

          @if (isLoadingLeaderboard()) {
            <p class="muted">Caricamento…</p>
          } @else if (leaderboardLoadFailed()) {
            <p class="error">Impossibile caricare la classifica.</p>
          } @else if (leaderboard().length === 0) {
            <p class="muted">Nessuna partita completata ancora.</p>
          } @else {
            <ol class="leaderboard">
              @for (entry of leaderboard(); track entry.userId) {
                <li>
                  <span class="name">{{ entry.username }}</span>
                  <span class="stat">{{ entry.gamesCompleted }} partite</span>
                  <span class="stat mono">{{ entry.bestMoves ?? '—' }} mosse (best)</span>
                </li>
              }
            </ol>
          }
        </section>

        <!-- Sezione Partite concluse -->
        <section class="panel">
          <div class="panel-header">
            <h2>Partite concluse</h2>
            <a routerLink="/completed" class="link-button">Vedi tutte →</a>
          </div>

          <div class="filter-bar">
            @for (filter of filters; track filter.mode) {
              <button
                type="button"
                class="filter-button"
                [class.active]="completedMode() === filter.mode"
                (click)="selectCompletedMode(filter.mode)">
                {{ filter.label }}
              </button>
            }
          </div>

          @if (isLoadingCompleted()) {
            <p class="muted">Caricamento…</p>
          } @else if (completedLoadFailed()) {
            <p class="error">Impossibile caricare le partite concluse.</p>
          } @else if (recentCompleted().length === 0) {
            <p class="muted">Nessuna partita conclusa ancora.</p>
          } @else {
            <ul class="completed-list">
              @for (game of recentCompleted(); track game.gameId) {
                <li>
                  <a class="completed-row" [routerLink]="['/completed', game.gameId]">
                    <span class="name">{{ game.username }}</span>
                    <span class="route-labels small">{{ game.startPageTitle }} → {{ game.targetPageTitle }}</span>
                    <span class="stat mono">{{ game.moves }} mosse</span>
                  </a>
                </li>
              }
            </ul>
          }
        </section>
      </main>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly gameService = inject(GameService);
  private readonly router = inject(Router);

  protected readonly filters = FILTERS;
  protected readonly sortOptions = SORT_OPTIONS;

  readonly isLoadingCurrent = signal(true);
  readonly isLoadingLeaderboard = signal(true);
  readonly isLoadingCompleted = signal(true);

  readonly currentLoadFailed = signal(false);
  readonly leaderboardLoadFailed = signal(false);
  readonly completedLoadFailed = signal(false);

  readonly isStarting = signal(false);
  readonly startErrorMessage = signal<string | null>(null);
  readonly currentGame = signal<GameState | null>(null);
  readonly leaderboard = signal<LeaderboardEntry[]>([]);
  readonly leaderboardMode = signal<GameFilterMode>('ALL');
  readonly leaderboardSort = signal<LeaderboardSortMode>('BEST_MOVES');
  readonly leaderboardRank = signal<number | null>(null);
  readonly recentCompleted = signal<CompletedGameSummary[]>([]);
  readonly completedMode = signal<GameFilterMode>('ALL');

  readonly startPageChoice = signal<WikiSearchResult | null>(null);
  readonly targetPageChoice = signal<WikiSearchResult | null>(null);
  // Whether each side was picked via the 🎲 Random button rather than
  // typed/searched — needed so createGame() can tell the backend this
  // side was left to chance, even though a concrete title is sent.
  readonly startWasRandom = signal(false);
  readonly targetWasRandom = signal(false);

  readonly progressX = signal(16);

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.loadCurrentGame();
    } else {
      this.isLoadingCurrent.set(false);
    }
    this.loadLeaderboard();
    this.loadCompleted();
  }

  loadCurrentGame(): void {
    this.isLoadingCurrent.set(true);
    this.currentLoadFailed.set(false);

    this.gameService
      .getCurrentGame()
      .pipe(
        timeout(REQUEST_TIMEOUT_MS),
        catchError(() => of('error' as const)),
      )
      .subscribe((result) => {
        this.isLoadingCurrent.set(false);

        if (result === 'error') {
          this.currentLoadFailed.set(true);
          return;
        }

        this.currentGame.set(result);
        if (result) {
          const step = Math.min(result.moves, 10);
          this.progressX.set(16 + step * 26);
        }
      });
  }

  selectLeaderboardMode(mode: GameFilterMode): void {
    if (this.leaderboardMode() === mode) return;
    this.leaderboardMode.set(mode);
    this.loadLeaderboard();
  }

  selectLeaderboardSort(sort: LeaderboardSortMode): void {
    if (this.leaderboardSort() === sort) return;
    this.leaderboardSort.set(sort);
    this.loadLeaderboard();
  }

  private loadLeaderboard(): void {
    this.isLoadingLeaderboard.set(true);
    this.leaderboardLoadFailed.set(false);

    this.gameService
      .getLeaderboard(this.leaderboardMode(), this.leaderboardSort(), 0, HOME_PREVIEW_SIZE)
      .pipe(
        timeout(REQUEST_TIMEOUT_MS),
        catchError(() => of('error' as const)),
      )
      .subscribe((result) => {
        this.isLoadingLeaderboard.set(false);

        if (result === 'error') {
          this.leaderboardLoadFailed.set(true);
          return;
        }

        this.leaderboard.set(result.entries);
        this.leaderboardRank.set(result.currentUserRank);
      });
  }

  selectCompletedMode(mode: GameFilterMode): void {
    if (this.completedMode() === mode) return;
    this.completedMode.set(mode);
    this.loadCompleted();
  }

  private loadCompleted(): void {
    this.isLoadingCompleted.set(true);
    this.completedLoadFailed.set(false);

    this.gameService
      .getCompletedGames(this.completedMode(), 0, HOME_PREVIEW_SIZE)
      .pipe(
        timeout(REQUEST_TIMEOUT_MS),
        catchError(() => of('error' as const)),
      )
      .subscribe((result) => {
        this.isLoadingCompleted.set(false);

        if (result === 'error') {
          this.completedLoadFailed.set(true);
          return;
        }

        this.recentCompleted.set(result.games);
      });
  }

  onStartPageSelected(event: { page: WikiSearchResult; wasRandom: boolean } | null): void {
    this.startPageChoice.set(event?.page ?? null);
    this.startWasRandom.set(event?.wasRandom ?? false);
  }

  onTargetPageSelected(event: { page: WikiSearchResult; wasRandom: boolean } | null): void {
    this.targetPageChoice.set(event?.page ?? null);
    this.targetWasRandom.set(event?.wasRandom ?? false);
  }

  startGame(confirmReplaceExisting = false): void {
    if (this.isStarting()) return;
    this.isStarting.set(true);
    this.startErrorMessage.set(null);

    this.gameService
      .createGame(
        this.startPageChoice()?.title,
        this.targetPageChoice()?.title,
        this.startWasRandom(),
        this.targetWasRandom(),
        confirmReplaceExisting,
      )
      .subscribe({
        next: (game) => this.router.navigate(['/game', game.gameId]),
        error: (err: HttpErrorResponse) => {
          this.isStarting.set(false);

          if (err.status === 409 && this.isDuplicateGameError(err.error)) {
            // Distinct from a plain-string 409 (e.g. "game already in
            // progress"): this shape means the player already completed
            // this exact pair. Ask before deleting that earlier record.
            const replace = confirm(
              `${err.error.message} (${err.error.existingMoves} mosse). Continuando, quella partita verrà eliminata. Vuoi procedere?`,
            );
            if (replace) {
              this.startGame(true);
            }
            return;
          }

          this.startErrorMessage.set(
            typeof err.error === 'string' ? err.error : 'Impossibile creare la partita, riprova.',
          );
        },
      });
  }

  private isDuplicateGameError(error: unknown): error is DuplicateGameError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'existingGameId' in error &&
      'existingMoves' in error &&
      'message' in error
    );
  }

  resumeGame(): void {
    const game = this.currentGame();
    if (game) this.router.navigate(['/game', game.gameId]);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}