import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../login/login.component.scss',
  template: `
    <div class="auth-screen">
      <div class="auth-card">
        <svg class="route" viewBox="0 0 240 40" aria-hidden="true">
          <line x1="14" y1="20" x2="226" y2="20" stroke="var(--line)" stroke-width="2" stroke-dasharray="3 6" />
          <circle cx="14" cy="20" r="6" fill="var(--wiki-blue)" />
          <circle cx="226" cy="20" r="6" fill="var(--route-red)" />
        </svg>

        <h1>Crea un account</h1>
        <p class="tagline">Serve solo per salvare le tue partite e la classifica.</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Username</span>
            <input type="text" formControlName="username" autocomplete="username" />
            @if (form.controls.username.touched && form.controls.username.invalid) {
              <small class="hint">Tra 3 e 50 caratteri.</small>
            }
          </label>

          <label class="field">
            <span>Email</span>
            <input type="email" formControlName="email" autocomplete="email" />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <small class="hint">Inserisci un'email valida.</small>
            }
          </label>

          <label class="field">
            <span>Password</span>
            <div class="password-wrapper">
              <input
                [type]="isPasswordVisible() ? 'text' : 'password'"
                formControlName="rawPassword"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="eye-toggle"
                (click)="isPasswordVisible.set(!isPasswordVisible())"
                [attr.aria-label]="isPasswordVisible() ? 'Nascondi password' : 'Mostra password'"
              >
                @if (isPasswordVisible()) {
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M12 6c-5 0-9.27 3.11-11 7.5 1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 9.11 17 6 12 6zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
                    />
                  </svg>
                } @else {
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M2 4.27 3.28 3l18 18-1.27 1.27-3.16-3.16A11.6 11.6 0 0 1 12 21c-5 0-9.27-3.11-11-7.5a12.1 12.1 0 0 1 4.17-5.4L2 4.27ZM12 8.5a5 5 0 0 1 5 5c0 .6-.11 1.16-.32 1.68l-1.6-1.6a3 3 0 0 0-3.76-3.76l-1.6-1.6c.72-.44 1.55-.72 2.28-.72Zm-9 5c1.13-2.87 3.63-5.14 6.68-5.86l1.65 1.65a3 3 0 0 0 3.88 3.88l2.44 2.44A9.6 9.6 0 0 1 12 19c-4.14 0-7.7-2.5-9-6.5Z"
                    />
                  </svg>
                }
              </button>
            </div>
            @if (form.controls.rawPassword.touched && form.controls.rawPassword.invalid) {
              <small class="hint">Almeno 8 caratteri.</small>
            }
          </label>

          @if (errorMessage()) {
            <p class="error">{{ errorMessage() }}</p>
          }

          <button type="submit" class="submit" [disabled]="form.invalid || isSubmitting()">
            {{ isSubmitting() ? 'Creazione in corso…' : 'Registrati' }}
          </button>
        </form>

        <p class="switch">
          Hai già un account? <a routerLink="/login">Accedi</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    rawPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isPasswordVisible = signal(false);

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err.status === 409 ? 'Username o email già in uso.' : 'Registrazione non riuscita.',
        );
      },
    });
  }
}