import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '',      redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // ── Admin ──────────────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [roleGuard(['ROLE_ADMINISTRADOR'])],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ── Abogado ────────────────────────────────────────────────────────
  {
    path: 'abogado',
    canActivate: [roleGuard(['ROLE_ABOGADO'])],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/abogado/abogado-dashboard.component')
            .then(m => m.AbogadoDashboardComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ── IT Manager ─────────────────────────────────────────────────────
  {
    path: 'it',
    canActivate: [roleGuard(['ROLE_IT_MANAGER'])],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/it/it-dashboard.component')
            .then(m => m.ItDashboardComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login' }
];