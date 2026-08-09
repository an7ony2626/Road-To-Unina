import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { GameState } from '../../core/models/game.model';
import { WikiArticleComponent } from './wiki-article/wiki-article.component';

@Component({
  selector: 'app-game',
  imports: [WikiArticleComponent],
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
          <span class="steps mono">{{ game()?.numSteps ?? 0 }} mosse</span>
          <button type="button" class="link-button" (click)="abandon()">Abbandona</button>
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
              <strong>{{ game()!.numSteps }}</strong> mosse e
              <strong>{{ elapsedLabel() }}</strong>.
            </p>
            <button type="button" class="link-button" (click)="goHome()">Esci</button>
            <button type="button" class="link-button" (click)="abandon()">Arrenditi</button>
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
  private startedAtMs = 0;

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

  goHome(): void {
    this.router.navigateByUrl('/');
  }

  private applyGameState(game: GameState): void {
    this.game.set(game);
    this.isCompleted.set(game.status === 'COMPLETED');
    this.syncTimer(game);
  }

  private syncTimer(game: GameState): void {
    this.startedAtMs = new Date(game.startedAt).getTime();
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
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - this.startedAtMs) / 1000));
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