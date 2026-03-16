import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeEs from '@angular/common/locales/es';
import { routes } from './app.routes';
import { jwtInterceptor } from './interceptors/jwt.interceptor';
import { registerLocaleData } from '@angular/common';




registerLocaleData(localeEs);
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // HttpClient con el interceptor JWT registrado globalmente
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
    { provide: LOCALE_ID, useValue: 'es' }
  ]
};