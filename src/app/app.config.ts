import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { CONVERSION_API } from './core/conversion-api/conversion-api.token';
import { MockConversionApiService } from './core/conversion-api/mock-conversion-api.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: CONVERSION_API,
      useExisting: MockConversionApiService,
    },
  ],
};
