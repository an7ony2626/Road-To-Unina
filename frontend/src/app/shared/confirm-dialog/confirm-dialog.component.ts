import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

// Generic yes/no dialog used in place of the native window.confirm(),
// which can't be styled and looks out of place next to the rest of
// the app. Purely presentational: the parent owns the open/closed
// state (via the `open` input) and reacts to the two outputs.
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './confirm-dialog.component.scss',
  template: `
    @if (open()) {
      <div class="overlay" (click)="cancelled.emit()">
        <div class="dialog" role="alertdialog" aria-modal="true" [attr.aria-label]="title()" (click)="$event.stopPropagation()">
          <h2>{{ title() }}</h2>
          <p>{{ message() }}</p>
          <div class="actions">
            <button type="button" class="btn-secondary" (click)="cancelled.emit()">
              {{ cancelLabel() }}
            </button>
            <button type="button" class="btn-primary" (click)="confirmed.emit()">
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input('Conferma');
  readonly message = input.required<string>();
  readonly confirmLabel = input('Conferma');
  readonly cancelLabel = input('Annulla');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}