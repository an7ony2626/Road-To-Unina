import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'game/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/game/game.component').then((m) => m.GameComponent),
  },
  {
    path: 'completed',
    loadComponent: () => import('./features/completed/completed-list.component').then((m) => m.CompletedListComponent),
  },
  {
    path: 'completed/:id',
    loadComponent: () => import('./features/completed/completed-detail.component').then((m) => m.CompletedDetailComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
];