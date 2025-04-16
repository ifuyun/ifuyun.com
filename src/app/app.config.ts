import { registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import zh from '@angular/common/locales/zh';
import { ApplicationConfig, ErrorHandler, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideNzI18n, zh_CN } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { routes } from './app.routes';
import { icons } from './config/icons.constant';
import { GlobalErrorHandler } from './global-error-handler';
import { ApiRequestInterceptor } from './interceptors/api-request.interceptor';

registerLocaleData(zh);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled'
      })
    ),
    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({
        includePostRequests: false,
        includeRequestsWithAuthHeaders: true
      })
    ),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: ApiRequestInterceptor, multi: true },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideNzI18n(zh_CN),
    importProvidersFrom(FormsModule),
    provideAnimationsAsync(),
    provideNzIcons(icons)
  ]
};
