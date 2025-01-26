import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { COOKIE_KEY_UV_ID } from '../config/common.constant';
import { AuthService } from '../services/auth.service';
import { SsrCookieService } from '../services/ssr-cookie.service';

@Injectable()
export class ApiRequestInterceptor implements HttpInterceptor {
  constructor(
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
    const faId = this.cookieService.get(COOKIE_KEY_UV_ID);
    if (faId) {
      req = req.clone({
        setHeaders: {
          Faid: faId
        }
      });
    }
    const cookie = this.cookieService.getCookie();
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
