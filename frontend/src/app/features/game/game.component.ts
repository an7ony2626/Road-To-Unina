import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { GameState } from '../../core/models/game.model';
import { WikiArticleComponent } from './wiki-article/wiki-article.component';
import { GamePathComponent } from '../../shared/game-path/game-path.component';
import { movesLabel } from '../../shared/duration/duration.pipe';

@Component({
  selector: 'app-game',
  imports: [WikiArticleComponent, GamePathComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'game.component.scss',
  template: `
    <div class="page">
      @if (isNavigating()) {
        <div class="progress-bar"><div class="progress-fill"></div></div>
      }

      <header class="topbar">
        <span class="route-labels">
          <strong>{{ game()?.startPageTitle }}</strong>
          →
          <strong>{{ game()?.targetPageTitle }}</strong>
        </span>
        <div class="topbar-actions">
          <span class="timer mono">{{ elapsedLabel() }}</span>
          <span class="steps mono">{{ movesLabel(game()?.moves ?? 0) }}</span>
          <button type="button" class="link-button" (click)="goHome()">Esci</button>
          <button type="button" class="link-button" (click)="abandon()">Arrenditi</button>
        </div>
      </header>

      @if (isLoading()) {
        <p class="muted centered">Caricamento pagina…</p>
      } @else if (isCompleted()) {
        <div class="completed-overlay">
          <div class="completed-card">
            <h1>Traguardo raggiunto</h1>
            <p class="muted">
              Da <strong>{{ game()!.startPageTitle }}</strong> a
              <strong>{{ game()!.targetPageTitle }}</strong> in
              <strong>{{ movesLabel(game()!.moves) }}</strong> e
              <strong>{{ elapsedLabel() }}</strong>.
            </p>
            <app-game-path [path]="game()!.path" />
            <button type="button" class="cta" (click)="goHome()">Torna alla home</button>
          </div>
        </div>
      } @else {
        @if (errorMessage()) {
          <p class="error">{{ errorMessage() }}</p>
        }
        <app-wiki-article
          [html]="game()?.currentPageContent ?? ''"
          [disabled]="isNavigating()"
          (titleClicked)="followLink($event)"
        />
      }
    </div>
  `,
})
export class GameComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly gameService = inject(GameService);

  readonly game = signal<GameState | null>(null);
  readonly isLoading = signal(true);
  readonly isNavigating = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isCompleted = signal(false);
  readonly elapsedLabel = signal('00:00');

  private timerHandle?: ReturnType<typeof setInterval>;
  private baselineElapsedSeconds = 0;
  private baselineWallClockMs = 0;

  protected readonly movesLabel = movesLabel;
  
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.gameService.getGame(id).subscribe((game) => {
      this.applyGameState(game);
      this.isLoading.set(false);
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  followLink(clickedTitle: string): void {
    const game = this.game();
    if (!game) return;

    this.errorMessage.set(null);
    this.isNavigating.set(true);

    this.gameService.followLink(game.gameId, clickedTitle).subscribe({
      next: (updated) => {
        this.applyGameState(updated);
        this.isNavigating.set(false);
        // New page, new scroll: without this the article keeps
        // whatever scroll height the player left the previous page
        // at, instead of opening at the top like a real navigation.
        window.scrollTo({ top: 0 });
      },
      error: () => {
        this.isNavigating.set(false);
        this.errorMessage.set(`'${clickedTitle}' non è un link valido su questa pagina.`);
      },
    });
  }

  abandon(): void {
    const game = this.game();
    if (!game) return;

    this.gameService.abandonGame(game.gameId).subscribe(() => this.goHome());
  }

  // "Esci": if the game is still in progress, freeze the server-side
  // clock first so idle time away doesn't count, then navigate away
  // regardless of whether that call succeeds — a network hiccup here
  // shouldn't trap the player on the game page.
  goHome(): void {
    const game = this.game();
    if (game?.status === 'IN_PROGRESS') {
      this.gameService.pauseGame(game.gameId).subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: () => this.router.navigateByUrl('/'),
      });
      return;
    }

    this.router.navigateByUrl('/');
  }

  private applyGameState(game: GameState): void {
    this.game.set(game);
    this.isCompleted.set(game.status === 'COMPLETED');
    this.syncTimer(game);
  }

  private syncTimer(game: GameState): void {
    this.baselineElapsedSeconds = game.elapsedSeconds;
    this.baselineWallClockMs = Date.now();
    this.updateElapsedLabel();

    if (game.status !== 'IN_PROGRESS') {
      this.stopTimer();
      return;
    }

    if (!this.timerHandle) {
      this.timerHandle = setInterval(() => this.updateElapsedLabel(), 1000);
    }
  }

  private updateElapsedLabel(): void {
    const elapsedSeconds =
      this.baselineElapsedSeconds + Math.floor((Date.now() - this.baselineWallClockMs) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
    this.elapsedLabel.set(`${minutes}:${seconds}`);
  }

  private stopTimer(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = undefined;
    }
  }
}