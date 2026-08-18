import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { GameService } from '../../core/services/game.service';
import { CompletedGameDetail } from '../../core/models/game.model';
import { GamePathComponent } from '../../shared/game-path/game-path.component';
import { DurationPipe } from '../../shared/duration/duration.pipe';
import { movesLabel } from '../../shared/duration/duration.pipe';
import { wikiUrl } from '../../shared/wiki-link/wiki-link';
import { withColdStartRetry } from '../../shared/http/cold-start-retry';

@Component({
  selector: 'app-completed-detail',
  imports: [RouterLink, GamePathComponent, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'completed-detail.component.scss',
  template: `
    <div class="page">
      <header class="topbar">
        <a routerLink="/" class="brand">WikiRace</a>
      </header>

      <main class="content">
        @if (isLoading()) {
          <p class="muted">{{ isWaking() ? 'Il server si sta risvegliando, un attimo…' : 'Caricamento…' }}</p>
        } @else if (loadFailed()) {
          <p class="error">Impossibile caricare questa partita.</p>
        } @else if (game(); as g) {
          <section class="summary-card">
            <p class="username">{{ g.username }}</p>
            <p class="route-labels">
              <a
                class="wiki-link"
                [href]="wikiUrl(g.startPageTitle)"
                target="_blank"
                rel="noopener noreferrer"
                title="Apri su Wikipedia"
              ><strong>{{ g.startPageTitle }}</strong></a>
              →
              <a
                class="wiki-link"
                [href]="wikiUrl(g.targetPageTitle)"
                target="_blank"
                rel="noopener noreferrer"
                title="Apri su Wikipedia"
              ><strong>{{ g.targetPageTitle }}</strong></a>
            </p>
            <p class="muted">
              {{ movesLabel(g.moves) }} · {{ g.totalTimeSeconds | duration }}
              · {{ g.isRandomChallenge ? 'Sfida casuale' : 'Sfida personalizzata' }}
            </p>
          </section>

          <app-game-path [path]="g.path" />
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
  readonly isWaking = signal(false);
  readonly game = signal<CompletedGameDetail | null>(null);

  protected readonly movesLabel = movesLabel;
  protected readonly wikiUrl = wikiUrl;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    withColdStartRetry(this.gameService.getCompletedGameDetail(id), () => this.isWaking.set(true))
      .pipe(catchError(() => of('error' as const)))
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