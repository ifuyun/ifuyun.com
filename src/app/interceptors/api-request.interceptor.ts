import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable, Optional, REQUEST } from '@angular/core';
import { Request } from 'express';
import { catchError, Observable, throwError } from 'rxjs';
import { ApiService } from '../services/api.service';
import { ErrorService } from '../services/error.service';
import { PlatformService } from '../services/platform.service';

@Injectable()
export class ApiRequestInterceptor implements HttpInterceptor {
  constructor(
    private platform: PlatformService,
    @Optional() @Inject(REQUEST) private request: Request,
    private readonly apiService: ApiService,
    private readonly errorService: ErrorService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.apiService.getToken();
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
