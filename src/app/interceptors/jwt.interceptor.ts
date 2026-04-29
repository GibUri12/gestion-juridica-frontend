import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token  = localStorage.getItem('token');

  // Clonar la request añadiendo el header si hay token
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      if (error.status === 401) {
        // Token expirado o inválido → forzar logout
        localStorage.clear();
        router.navigate(['/login']);
      }

      if (error.status === 403) {
        // Acceso denegado → redirigir al home del rol
        // EXCEPCIÓN: No redirigir si es una petición de notificaciones (polling del sidebar)
        // para evitar redireccionamientos involuntarios al navegar
        const isNotifRequest = req.url.includes('/api/notificaciones');
        if (!isNotifRequest) {
          const role = localStorage.getItem('role');
          const home = getHomePath(role);
          router.navigate([home]);
        }
      }

      return throwError(() => error);
    })
  );
};

function getHomePath(role: string | null): string {
  switch (role) {
    case 'ROLE_ADMINISTRADOR': return '/admin/dashboard';
    case 'ROLE_ABOGADO':       return '/abogado/dashboard';
    case 'ROLE_IT_MANAGER':    return '/it/dashboard';
    default:                   return '/login';
  }
}