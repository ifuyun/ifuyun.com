import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable()
export class ApiRequestInterceptor implements HttpInterceptor {
  constructor(@Inject(PLATFORM_ID) private platform: Object) {
  }

  intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isApiRequest = httpRequest.url.startsWith('/api');
    const token = localStorage.getItem('token');
    if (token) {
      httpRequest = httpRequest.clone({
        headers: httpRequest.headers.set('Authorization', 'Bearer ' + token)
      });
    }
    if (isApiRequest && isPlatformServer(this.platform)) {
      httpRequest = httpRequest.clone({
        url: environment.proxy.target + httpRequest.url
      });
    }
    if (isApiRequest && httpRequest.responseType === 'json') {
      return next.handle(httpRequest).pipe(map((event) => this.handleJsonResponse(event)));
    }
    return next.handle(httpRequest);
  }

  private handleJsonResponse(event: HttpEvent<any>) {
    // todo
    // if (event instanceof HttpResponse) {
    // }
    return event;
  }
}
