import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ApiRequestInterceptor } from './api-request.interceptor';

/** Http interceptor providers in outside-in order */
export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: ApiRequestInterceptor, multi: true }
];
