import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class ApiRequestInterceptor implements HttpInterceptor {
  constructor(@Inject(PLATFORM_ID) private platform: Object) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req.clone({
      url: isPlatformServer(this.platform) && req.url.startsWith('/api') ? environment.proxy.target + req.url : req.url
    }));
  }
}
