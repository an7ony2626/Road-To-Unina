import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { GameService } from '../../core/services/game.service';
import { CompletedGameSummary, GameState, LeaderboardEntry } from '../../core/models/game.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'home.component.scss',
  template: `
    <div class="page">
      <header class="topbar">
        <span class="brand">WikiRace</span>
        <div class="topbar-actions">
          <span class="username">{{ auth.username() }}</span>
          <button type="button" class="link-button" (click)="logout()">Esci</button>
        </div>
      </header>

      <main class="content">
        <section class="status-card">
          <svg class="route" viewBox="0 0 320 40" aria-hidden="true">
            <line x1="16" y1="20" x2="304" y2="20" stroke="var(--line)" stroke-width="2" stroke-dasharray="3 6" />
            <circle [attr.cx]="progressX()" cy="20" r="7" fill="var(--wiki-blue)" />
            <circle cx="304" cy="20" r="7" fill="var(--route-red)" />
          </svg>

          @if (isLoading()) {
            <p class="muted">Verifica partita in corso…</p>
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
            <p class="muted">Trova il percorso più breve tra due pagine di Wikipedia.</p>
            <button type="button" class="cta" [disabled]="isStarting()" (click)="startGame()">
              {{ isStarting() ? 'Creazione…' : 'Inizia una nuova sfida' }}
            </button>
          }
        </section>

        <section class="panel">
          <div class="panel-header">
            <h2>Classifica</h2>
          </div>
          @if (leaderboard().length === 0) {
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
            <h2>Partite concluse</h2>
            <a routerLink="/completed">Vedi tutte</a>
          </div>
          @if (recentCompleted().length === 0) {
            <p class="muted">Nessuna partita conclusa ancora.</p>
          } @else {
            <ul class="completed-list">
              @for (game of recentCompleted(); track game.gameId) {
                <li>
                  <span class="name">{{ game.username }}</span>
                  <span class="route-labels small">{{ game.startPageTitle }} → {{ game.targetPageTitle }}</span>
                  <span class="stat mono">{{ game.numSteps }} mosse</span>
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

  readonly isLoading = signal(true);
  readonly isStarting = signal(false);
  readonly currentGame = signal<GameState | null>(null);
  readonly leaderboard = signal<LeaderboardEntry[]>([]);
  readonly recentCompleted = signal<CompletedGameSummary[]>([]);

  // Blue node rests at the start of the track with no game, and creeps
  // forward with real progress once one exists — position encodes state,
  // it's not decorative motion.
  readonly progressX = signal(16);

  ngOnInit(): void {
    forkJoin({
      current: this.gameService.getCurrentGame(),
      leaderboard: this.gameService.getLeaderboard(),
      completed: this.gameService.getCompletedGames(),
    }).subscribe(({ current, leaderboard, completed }) => {
      this.currentGame.set(current);
      this.leaderboard.set(leaderboard.slice(0, 5));
      this.recentCompleted.set(completed.slice(0, 5));
      this.isLoading.set(false);

      if (current) {
        const step = Math.min(current.numSteps, 10);
        this.progressX.set(16 + step * 26);
      }
    });
  }

  startGame(): void {
    if (this.isStarting()) return;
    this.isStarting.set(true);

    this.gameService.createGame().subscribe((game) => {
      this.router.navigate(['/game', game.gameId]);
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