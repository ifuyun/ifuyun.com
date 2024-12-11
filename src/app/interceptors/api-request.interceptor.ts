import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable, Optional, REQUEST } from '@angular/core';
import { Request } from 'express';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ApiRequestInterceptor implements HttpInterceptor {
  constructor(
    @Optional() @Inject(REQUEST) private readonly request: Request,
    private readonly authService: AuthService
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
    if (this.request && this.request.headers.cookie) {
      req = req.clone({
        setHeaders: {
          Cookie: this.request.headers.cookie
        }
      });
    }
    return next.handle(req).pipe(catchError((err) => throwError(() => err)));
  }
}
