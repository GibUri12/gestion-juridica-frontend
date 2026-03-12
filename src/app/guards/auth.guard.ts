import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';


export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token  = localStorage.getItem('token');

  if (!token || isTokenExpired(token)) {
    localStorage.clear();
    router.navigate(['/login']);
    return false;
  }
  return true;
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const router   = inject(Router);
    const token    = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    // Sin sesión → login
    if (!token || isTokenExpired(token)) {
      localStorage.clear();
      router.navigate(['/login']);
      return false;
    }

    // Rol no permitido → redirige al dashboard correcto del usuario
    if (!userRole || !allowedRoles.includes(userRole)) {
      router.navigate([getHomePath(userRole)]);
      return false;
    }

    return true;
  };
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Decodifica el payload del JWT y verifica si ya expiró. */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp está en segundos
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // token malformado → tratar como expirado
  }
}

/** Devuelve la ruta home según el rol, para redirigir correctamente. */
function getHomePath(role: string | null): string {
  switch (role) {
    case 'ROLE_ADMINISTRADOR': return '/admin/dashboard';
    case 'ROLE_ABOGADO':       return '/abogado/dashboard';
    case 'ROLE_IT_MANAGER':    return '/it/dashboard';
    default:                   return '/login';
  }
}