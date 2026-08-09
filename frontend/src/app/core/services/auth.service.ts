import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

const TOKEN_KEY = 'wikirace_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  // Single source of truth for the current token. Everything else
  // (isAuthenticated, username) derives from it — no separate state
  // to keep in sync.
  private readonly tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);
  readonly username = computed(() => this.decodeUsername(this.tokenSignal()));

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('${environment.apiUrl}/auth/login', request)
      .pipe(tap((response) => this.storeToken(response.token)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('${environment.apiUrl}/auth/register', request)
      .pipe(tap((response) => this.storeToken(response.token)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.tokenSignal.set(null);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  private storeToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.tokenSignal.set(token);
  }

  // JWT payload is not secret (it's already visible to anyone with the
  // token); decoding client-side just to display the username avoids
  // a round trip to a "whoami" endpoint that doesn't exist yet.
  private decodeUsername(token: string | null): string | null {
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const claims = JSON.parse(json) as { sub?: string };
      return claims.sub ?? null;
    } catch {
      return null;
    }
  }
}