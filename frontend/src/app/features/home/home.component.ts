import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, of, timeout } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { GameService } from '../../core/services/game.service';
import { CompletedGameSummary, GameState, LeaderboardEntry } from '../../core/models/game.model';
import { WikiSearchResult } from '../../core/models/wiki-search.model';
import { PageSearchComponent } from '../../shared/page-search/page-search.component';
import { AnimatedBackgroundComponent } from '../../shared/animated-background/animated-background.component';

const REQUEST_TIMEOUT_MS = 10_000;

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
            <p class="muted">Accedi per avviare una sfida. Puoi comunque esplorare classifica e partite concluse qui sotto.</p>
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
              <p class="muted">{{ currentGame()!.numSteps }} mosse fatte finora</p>
              <button type="button" class="cta" (click)="resumeGame()">Riprendi la sfida</button>
            } @else {
              <h1>Pronto per una sfida?</h1>
              <p class="muted">Lascia scegliere il caso, oppure imposta tu le pagine di partenza e arrivo.</p>

              <div class="page-picker">
                <app-page-search label="Pagina di partenza" (pageSelected)="startPageChoice.set($event)" />
                <span class="picker-arrow" aria-hidden="true">→</span>
                <app-page-search label="Pagina di arrivo" (pageSelected)="targetPageChoice.set($event)" />
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
            <h2>Classifica</h2>
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
                  <span class="stat mono">{{ entry.bestSteps ?? '—' }} mosse (best)</span>
                </li>
              }
            </ol>
          }
        </section>

        <section class="panel">
          <div class="panel-header">
            <div class="panel-header">
              <h2>Partite concluse</h2>
            </div>
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
                    <span class="stat mono">{{ game.numSteps }} mosse</span>
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
  readonly recentCompleted = signal<CompletedGameSummary[]>([]);

  readonly startPageChoice = signal<WikiSearchResult | null>(null);
  readonly targetPageChoice = signal<WikiSearchResult | null>(null);

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
          const step = Math.min(result.numSteps, 10);
          this.progressX.set(16 + step * 26);
        }
      });
  }

  private loadLeaderboard(): void {
    this.gameService
      .getLeaderboard()
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

        this.leaderboard.set(result.slice(0, 5));
      });
  }

  private loadCompleted(): void {
    this.gameService
      .getCompletedGames()
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

        this.recentCompleted.set(result.slice(0, 5));
      });
  }

  startGame(): void {
    if (this.isStarting()) return;
    this.isStarting.set(true);
    this.startErrorMessage.set(null);

    this.gameService.createGame(this.startPageChoice()?.title, this.targetPageChoice()?.title).subscribe({
      next: (game) => this.router.navigate(['/game', game.gameId]),
      error: (err: HttpErrorResponse) => {
        this.isStarting.set(false);
        this.startErrorMessage.set(
          typeof err.error === 'string' ? err.error : 'Impossibile creare la partita, riprova.',
        );
      },
    });
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