import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of, timeout } from 'rxjs';
import { GameService } from '../../core/services/game.service';
import { CompletedGameSummary, GameFilterMode } from '../../core/models/game.model';
import { DurationPipe } from '../../shared/duration/duration.pipe';

const REQUEST_TIMEOUT_MS = 10_000;
const PAGE_SIZE = 10;

const FILTERS: { mode: GameFilterMode; label: string }[] = [
  { mode: 'ALL', label: 'Tutte' },
  { mode: 'RANDOM', label: 'Casuali' },
  { mode: 'CUSTOM', label: 'Personalizzate' },
  { mode: 'UNINA', label: 'Road to Unina' },
];

@Component({
  selector: 'app-completed-list',
  imports: [RouterLink, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './completed-list.component.scss',
  template: `
    <div class="page">
      <header class="topbar">
        <a routerLink="/" class="link-button">← Home</a>
        <span class="brand">Partite concluse</span>
      </header>

      <main class="content">
        <div class="filter-bar">
          @for (filter of filters; track filter.mode) {
            <button
              type="button"
              class="filter-button"
              [class.active]="mode() === filter.mode"
              (click)="selectMode(filter.mode)"
            >
              {{ filter.label }}
            </button>
          }
        </div>

        @if (isLoading()) {
          <p class="muted">Caricamento…</p>
        } @else if (loadFailed()) {
          <p class="error">Impossibile caricare le partite concluse.</p>
        } @else if (games().length === 0) {
          <p class="muted">Nessuna partita conclusa ancora.</p>
        } @else {
          <ul class="completed-list">
            @for (game of games(); track game.gameId) {
              <li>
                <a class="completed-row" [routerLink]="['/completed', game.gameId]">
                  <span class="name">{{ game.username }}</span>
                  <span class="route-labels">{{ game.startPageTitle }} → {{ game.targetPageTitle }}</span>
                  <span class="stat mono">{{ game.moves }} mosse</span>
                  <span class="stat mono">{{ game.totalTimeSeconds | duration }}</span>
                </a>
              </li>
            }
          </ul>

          @if (hasMore()) {
            <button type="button" class="load-more" [disabled]="isLoadingMore()" (click)="loadMore()">
              {{ isLoadingMore() ? 'Caricamento…' : 'Carica altre ↓' }}
            </button>
          }
        }
      </main>
    </div>
  `,
})
export class CompletedListComponent implements OnInit {
  private readonly gameService = inject(GameService);

  protected readonly filters = FILTERS;

  readonly isLoading = signal(true);
  readonly isLoadingMore = signal(false);
  readonly loadFailed = signal(false);
  readonly games = signal<CompletedGameSummary[]>([]);
  readonly hasMore = signal(false);
  readonly mode = signal<GameFilterMode>('ALL');

  private page = 0;

  ngOnInit(): void {
    this.loadPage(0, false);
  }

  selectMode(mode: GameFilterMode): void {
    if (this.mode() === mode) return;
    this.mode.set(mode);
    this.loadPage(0, false);
  }

  loadMore(): void {
    if (this.isLoadingMore() || !this.hasMore()) return;
    this.loadPage(this.page + 1, true);
  }

  private loadPage(page: number, append: boolean): void {
    (append ? this.isLoadingMore : this.isLoading).set(true);
    this.loadFailed.set(false);

    this.gameService
      .getCompletedGames(this.mode(), page, PAGE_SIZE)
      .pipe(
        timeout(REQUEST_TIMEOUT_MS),
        catchError(() => of('error' as const)),
      )
      .subscribe((result) => {
        this.isLoading.set(false);
        this.isLoadingMore.set(false);

        if (result === 'error') {
          this.loadFailed.set(true);
          return;
        }

        this.page = page;
        this.hasMore.set(result.hasMore);
        this.games.set(append ? [...this.games(), ...result.games] : result.games);
      });
  }
}