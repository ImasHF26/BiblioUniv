import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { routes } from './app.routes';
import { jwtInterceptor, errorInterceptor } from './core/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    // Angular 21 : Zone-based (remplacer par provideExperimentalZonelessChangeDetection()
    // pour activer le mode sans Zone.js, entièrement basé sur les Signals)
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),           // Angular 17+ : transitions de vue animées
    ),
    provideHttpClient(
      withInterceptors([jwtInterceptor, errorInterceptor]),
      withFetch(),                    // Angular 17+ : basculer vers l'API Fetch native au lieu de XMLHttpRequest
    ),
    provideAnimations(),             // Synchrone — évite le bug du datepicker avec async
    provideNativeDateAdapter(),        // Requis par MatDatepicker pour la conversion des dates
  ],
};
