import { ChangeDetectionStrategy, Component, ElementRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { GameState } from '../../core/models/game.model';

@Component({
  selector: 'app-game',
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
              <strong>{{ game()!.numSteps }}</strong> mosse.
            </p>
            <button type="button" class="cta" (click)="goHome()">Torna alla home</button>
          </div>
        </div>
      } @else {
        @if (errorMessage()) {
          <p class="error">{{ errorMessage() }}</p>
        }
        <article
          #content
          class="wiki-content"
          [class.navigating]="isNavigating()"
          [innerHTML]="sanitizedContent()"
          (click)="onContentClick($event)"
        ></article>
      }
    </div>
  `,
})
export class GameComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly gameService = inject(GameService);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly contentEl = viewChild<ElementRef<HTMLElement>>('content');

  readonly game = signal<GameState | null>(null);
  readonly isLoading = signal(true);
  readonly isNavigating = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isCompleted = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.gameService.getGame(id).subscribe((game) => {
      this.applyGameState(game);
      this.isLoading.set(false);
    });
  }

  sanitizedContent() {
    const html = this.game()?.currentPageContent ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // Wikipedia's own markup is what's rendered, so any click could land
  // on a nested <span> or <b> inside the link — closest() walks up to
  // the actual anchor rather than assuming the event target is one.
  onContentClick(event: MouseEvent): void {
    if (this.isNavigating()) return;

    const anchor = (event.target as HTMLElement).closest('a');
    if (!anchor || !this.contentEl()?.nativeElement.contains(anchor)) return;

    const href = anchor.getAttribute('href') ?? '';
    if (!href.startsWith('/wiki/')) return;

    event.preventDefault();

    const title = decodeURIComponent(href.slice('/wiki/'.length).split('#')[0]).replace(/_/g, ' ');
    this.followLink(title);
  }

  private followLink(clickedTitle: string): void {
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
  }
}