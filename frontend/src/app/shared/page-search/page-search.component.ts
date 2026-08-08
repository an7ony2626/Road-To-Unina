import { ChangeDetectionStrategy, Component, inject, input, output, signal} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { WikiService } from '../../core/services/wiki.service';
import { WikiSearchResult } from '../../core/models/wiki-search.model';

@Component({
  selector: 'app-page-search',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './page-search.component.scss',
  template: `
    <div class="page-search">
      <label class="field-label">{{ label() }}</label>

      @if (selected(); as page) {
        <div class="selected-page">
          <span class="thumb" [class.placeholder]="!page.thumbnailUrl">
            @if (page.thumbnailUrl) {
              <img [src]="page.thumbnailUrl" [alt]="page.title" />
            }
          </span>
          <span class="title">{{ page.title }}</span>
          <button type="button" class="link-button" (click)="clear()">Cambia</button>
        </div>
      } @else {
        <input
          type="text"
          class="search-input"
          [formControl]="queryControl"
          placeholder="Cerca una pagina Wikipedia…"
          autocomplete="off"
        />

        @if (isSearching()) {
          <p class="muted small">Ricerca in corso…</p>
        } @else if (results().length > 0) {
          <ul class="results">
            @for (result of results(); track result.title) {
              <li>
                <button type="button" class="result-row" (click)="select(result)">
                  <span class="thumb" [class.placeholder]="!result.thumbnailUrl">
                    @if (result.thumbnailUrl) {
                      <img [src]="result.thumbnailUrl" [alt]="result.title" />
                    }
                  </span>
                  <span class="result-text">
                    <span class="result-title">{{ result.title }}</span>
                    @if (result.extract) {
                      <span class="result-extract">{{ result.extract }}</span>
                    }
                  </span>
                </button>
              </li>
            }
          </ul>
        }
      }
    </div>
  `,
})
export class PageSearchComponent {
  private readonly wikiService = inject(WikiService);

  readonly label = input.required<string>();
  readonly pageSelected = output<WikiSearchResult | null>();

  readonly queryControl = new FormControl('', { nonNullable: true });
  readonly selected = signal<WikiSearchResult | null>(null);
  readonly isSearching = signal(false);

  readonly results = toSignal(
    this.queryControl.valueChanges.pipe(
      tap(() => this.isSearching.set(true)),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query) => {
        const trimmed = query.trim();
        if (trimmed.length < 2) return of<WikiSearchResult[]>([]);
        return this.wikiService.search(trimmed);
      }),
      tap(() => this.isSearching.set(false)),
    ),
    { initialValue: [] as WikiSearchResult[] },
  );

  select(result: WikiSearchResult): void {
    this.selected.set(result);
    this.queryControl.setValue('', { emitEvent: false });
    this.pageSelected.emit(result);
  }

  clear(): void {
    this.selected.set(null);
    this.pageSelected.emit(null);
  }
}