import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Inject, Injectable, Optional } from '@angular/core';
import { makeStateKey, StateKey, TransferState } from '@angular/platform-browser';
import { REQUEST } from '@nestjs/ng-universal/dist/tokens';
import { Request } from 'express';
import { Observable, of, tap } from 'rxjs';
import { environment as env } from '../../environments/environment';
import { PlatformService } from '../core/platform.service';

@Injectable()
export class ApiRequestInterceptor implements HttpInterceptor {
  constructor(
    private platform: PlatformService,
    private state: TransferState,
    @Optional() @Inject(REQUEST) private request: Request
  ) {}

  intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isApiRequest = httpRequest.url.startsWith('/api');
    const token = this.platform.isBrowser ? localStorage.getItem('token') : '';
    if (isApiRequest) {
      if (token) {
        httpRequest = httpRequest.clone({
          setHeaders: { Authorization: 'Bearer ' + token }
        });
      }
      httpRequest = httpRequest.clone({
        url: env.api.host + httpRequest.url
      });
      if (this.request && this.request.headers.cookie) {
        httpRequest = httpRequest.clone({
          setHeaders: {
            Cookie: this.request.headers.cookie
          }
        });
      }
    }
    if (httpRequest.method !== 'GET') {
      return next.handle(httpRequest);
    }

    const url = httpRequest.url.replace(/^https?:\/\/[^\/]+/i, '');
    const urlParam = httpRequest.params.toString();
    const key: StateKey<string> = makeStateKey<string>(`${url}${urlParam ? '?' + urlParam : ''}`);

    if (this.platform.isServer) {
      return next.handle(httpRequest).pipe(
        tap((event) => {
          this.state.set(key, (<HttpResponse<any>>event).body);
        })
      );
    }

    const storedResponse = this.state.get<any>(key, null);
    if (storedResponse) {
      const response = new HttpResponse({ body: storedResponse, status: 200 });
      this.state.remove(key);

      return of(response);
    } else {
      return next.handle(httpRequest);
    }
  }
}
