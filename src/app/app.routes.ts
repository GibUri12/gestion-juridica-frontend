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
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./components/dashboard/clientes/clientes.component')
            .then(m => m.ClientesComponent)
      },
      {path:'expedientes',
      loadComponent: () => 
        import ('./components/abogado/expedientes/expedientes-lista.component')
        .then(m => m.ExpedientesListaComponent)
      },
      {
      path: 'audiencias',
        loadComponent: () =>
          import('./components/dashboard/audiencias/audiencias.component')
            .then(m => m.AudienciasComponent)
      }
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
      {
        path: 'clientes',
        loadComponent: () =>
          import('./components/it/clientes-it.component')
            .then(m => m.ClientesItComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login' }
];