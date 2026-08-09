import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, timeout } from 'rxjs';
import { GameService } from '../../core/services/game.service';
import { CompletedGameDetail } from '../../core/models/game.model';

const REQUEST_TIMEOUT_MS = 10_000;

@Component({
  selector: 'app-completed-detail',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'completed-detail.component.scss',
  template: `
    <div class="page">
      <header class="topbar">
        <a routerLink="/" class="brand">WikiRace</a>
      </header>

      <main class="content">
        @if (isLoading()) {
          <p class="muted">Caricamento…</p>
        } @else if (loadFailed()) {
          <p class="error">Impossibile caricare questa partita.</p>
        } @else if (game(); as g) {
          <section class="summary-card">
            <p class="username">{{ g.username }}</p>
            <p class="route-labels">
              <strong>{{ g.startPageTitle }}</strong> → <strong>{{ g.targetPageTitle }}</strong>
            </p>
            <p class="muted">{{ g.numSteps }} mosse · {{ g.totalTimeSeconds }}s</p>
          </section>

          <section class="path-card">
            <h2>Percorso seguito</h2>
            <ol class="path-chain">
              @for (step of g.path; track step.stepNumber; let last = $last) {
                <li>
                  <span class="page-title">{{ step.pageTitle }}</span>
                  @if (!last) {
                    <span class="arrow" aria-hidden="true">→</span>
                  }
                </li>
              }
            </ol>
          </section>
        }
      </main>
    </div>
  `,
})
export class CompletedDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly gameService = inject(GameService);

  readonly isLoading = signal(true);
  readonly loadFailed = signal(false);
  readonly game = signal<CompletedGameDetail | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.gameService
      .getCompletedGameDetail(id)
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

        this.game.set(result);
      });
  }
}