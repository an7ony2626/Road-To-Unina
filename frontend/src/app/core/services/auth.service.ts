import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { environment } from '../../environments/environments';

const TOKEN_KEY = 'wikirace_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly tokenSignal = signal<string | null>(this.readValidToken());

  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);
  readonly username = computed(() => this.decodeClaims(this.tokenSignal())?.sub ?? null);

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, request)
      .pipe(tap((response) => this.storeToken(response.token)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, request)
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

  private readValidToken(): string | null {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return null;

    const claims = this.decodeClaims(stored);
    if (!claims?.exp || claims.exp * 1000 <= Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }

    return stored;
  }

  private decodeClaims(token: string | null): { sub?: string; exp?: number } | null {
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json) as { sub?: string; exp?: number };
    } catch {
      return null;
    }
  }
}