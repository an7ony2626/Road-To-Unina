import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'login.component.scss',
  template: `
    <div class="auth-screen">
      <div class="auth-card">
        <svg class="route" viewBox="0 0 240 40" aria-hidden="true">
          <line x1="14" y1="20" x2="226" y2="20" stroke="var(--line)" stroke-width="2" stroke-dasharray="3 6" />
          <circle cx="14" cy="20" r="6" fill="var(--wiki-blue)" />
          <circle cx="226" cy="20" r="6" fill="var(--route-red)" />
        </svg>

        <h1>WikiRace</h1>
        <p class="tagline">Trova il percorso più breve tra due pagine di Wikipedia.</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Username</span>
            <input type="text" formControlName="username" autocomplete="username" />
          </label>

          <label class="field">
            <span>Password</span>
            <div class="password-wrapper">
              <input
                [type]="isPasswordVisible() ? 'text' : 'password'"
                formControlName="rawPassword"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="eye-toggle"
                (click)="isPasswordVisible.set(!isPasswordVisible())"
                [attr.aria-label]="isPasswordVisible() ? 'Nascondi password' : 'Mostra password'"
              >
                @if (isPasswordVisible()) {
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                } @else {
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-6 0-10-8-10-8a20.3 20.3 0 0 1 5.06-6.06" />
                    <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c6 0 10 8 10 8a20.3 20.3 0 0 1-3.22 4.44" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                }
              </button>
            </div>
          </label>

          @if (errorMessage()) {
            <p class="error">{{ errorMessage() }}</p>
          }

          <button type="submit" class="submit" [disabled]="form.invalid || isSubmitting()">
            {{ isSubmitting() ? 'Accesso in corso…' : 'Accedi' }}
          </button>
        </form>

        <p class="switch">
          Non hai un account? <a routerLink="/register">Registrati</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    rawPassword: ['', Validators.required],
  });

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isPasswordVisible = signal(false);

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Username o password non corretti.');
      },
    });
  }
}