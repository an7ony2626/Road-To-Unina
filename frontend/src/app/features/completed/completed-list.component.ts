import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of, timeout } from 'rxjs';
import { GameService } from '../../core/services/game.service';
import { CompletedGameSummary } from '../../core/models/game.model';

const REQUEST_TIMEOUT_MS = 10_000;

@Component({
  selector: 'app-completed-list',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './completed-list.component.scss',
  template: `
    <div class="page">
      <header class="topbar">
        <a routerLink="/" class="link-button">← Home</a>
        <span class="brand">Partite concluse</span>
      </header>

      <main class="content">
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
                  <span class="stat mono">{{ game.numSteps }} mosse</span>
                  <span class="stat mono">{{ game.totalTimeSeconds }}s</span>
                </a>
              </li>
            }
          </ul>
        }
      </main>
    </div>
  `,
})
export class CompletedListComponent implements OnInit {
  private readonly gameService = inject(GameService);

  readonly isLoading = signal(true);
  readonly loadFailed = signal(false);
  readonly games = signal<CompletedGameSummary[]>([]);

  ngOnInit(): void {
    this.gameService
      .getCompletedGames()
      .pipe(
        timeout(REQUEST_TIMEOUT_MS),
        catchError(() => of('error' as const)),
      )
      .subscribe((result) => {
        this.isLoading.set(false);

        if (result === 'error') {
          this.loadFailed.set(true);
          return;
        }

        this.games.set(result);
      });
  }
}