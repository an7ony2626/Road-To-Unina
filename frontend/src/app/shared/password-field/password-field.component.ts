import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-password-field',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'password-field.component.scss',
  template: `
    <label class="field">
      <span>{{ label() }}</span>
      <div class="password-wrapper">
        <input
          [type]="isVisible() ? 'text' : 'password'"
          [formControl]="control()"
          [autocomplete]="autocomplete()"
        />
        <button
          type="button"
          class="eye-toggle"
          (click)="isVisible.set(!isVisible())"
          [attr.aria-label]="isVisible() ? 'Nascondi password' : 'Mostra password'"
        >
          @if (isVisible()) {
            <svg
              viewBox="0 0 24 24" width="18" height="18" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            >
              <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          } @else {
            <svg
              viewBox="0 0 24 24" width="18" height="18" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            >
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-6 0-10-8-10-8a20.3 20.3 0 0 1 5.06-6.06" />
              <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c6 0 10 8 10 8a20.3 20.3 0 0 1-3.22 4.44" />
              <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
              <line x1="2" y1="2" x2="22" y2="22" />
            </svg>
          }
        </button>
      </div>
      @if (hint() && control().touched && control().invalid) {
        <small class="hint">{{ hint() }}</small>
      }
    </label>
  `,
})
export class PasswordFieldComponent {
  readonly control = input.required<FormControl<string>>();
  readonly label = input('Password');
  readonly autocomplete = input<'current-password' | 'new-password'>('current-password');
  readonly hint = input<string | null>(null);

  protected readonly isVisible = signal(false);
}
