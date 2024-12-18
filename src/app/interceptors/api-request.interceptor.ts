import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable, Optional, REQUEST } from '@angular/core';
import { Request } from 'express';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SsrCookieService } from '../services/ssr-cookie.service';

@Injectable()
export class ApiRequestInterceptor implements HttpInterceptor {
  constructor(
    @Optional() @Inject(REQUEST) private readonly request: Request,
    private readonly authService: AuthService,
    private readonly cookieService: SsrCookieService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: 'Bearer ' + token
        }
      });
    }
    const cookie = this.cookieService.getHeaderCookie();
    if (cookie) {
      req = req.clone({
        setHeaders: {
          Cookie: cookie
        }
      });
    }
    req = req.clone({
      withCredentials: true
    });
    return next.handle(req).pipe(catchError((err) => throwError(() => err)));
  }
}
