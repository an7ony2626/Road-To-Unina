// Mirrors backend DTOs 1:1 (it.unina.demo.dto.request / .response).
// Field names must match exactly — no mapping layer on this side.

export interface LoginRequest {
  username: string;
  rawPassword: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  rawPassword: string;
}

export interface AuthResponse {
  token: string;
}