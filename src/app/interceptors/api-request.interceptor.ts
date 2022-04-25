import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment as env } from '../../environments/environment';
import { PlatformService } from '../core/platform.service';

@Injectable()
export class ApiRequestInterceptor implements HttpInterceptor {
  constructor(
    private platform: PlatformService
  ) {
  }

  intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isApiRequest = httpRequest.url.startsWith('/api');
    const token = this.platform.isBrowser ? localStorage.getItem('token') : '';
    if (token) {
      httpRequest = httpRequest.clone({
        headers: httpRequest.headers.set('Authorization', 'Bearer ' + token)
      });
    }
    if (isApiRequest && this.platform.isServer) {
      httpRequest = httpRequest.clone({
        url: env.api.host + httpRequest.url
      });
    }
    return next.handle(httpRequest);
  }
}
