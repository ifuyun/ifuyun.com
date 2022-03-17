import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { environment as env } from '../../environments/environment';

@Injectable()
export class ApiRequestInterceptor implements HttpInterceptor {
  constructor(
    @Inject(PLATFORM_ID) private platform: Object,
    @Optional() @Inject(REQUEST) private request: Request
  ) {
  }

  intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isApiRequest = httpRequest.url.startsWith('/api');
    const token = isPlatformBrowser(this.platform) ? localStorage.getItem('token') : '';
    if (token) {
      httpRequest = httpRequest.clone({
        headers: httpRequest.headers.set('Authorization', 'Bearer ' + token)
      });
    }
    if (isApiRequest && isPlatformServer(this.platform)) {
      httpRequest = httpRequest.clone({
        url: env.api.host + httpRequest.url
      });
    }
    return next.handle(httpRequest);
  }
}
