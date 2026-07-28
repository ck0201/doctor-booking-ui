import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Component input binding lets pages read query and route parameters as
    // signals instead of injecting ActivatedRoute (ADR-021).
    provideRouter(routes, withComponentInputBinding()),
  ],
};
