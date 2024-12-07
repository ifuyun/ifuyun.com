import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { catchError, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { COOKIE_KEY_USER_TOKEN } from '../config/common.constant';
import { HttpResponseEntity } from '../interfaces/http-response';
import { CommonService } from './common.service';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly commonService: CommonService,
    private readonly message: MessageService,
    private readonly cookieService: CookieService
  ) {}

  getApiUrl(path: string): string {
    return `${environment.apiBase}${path}`;
  }

  getToken(): string {
    return this.cookieService.get(COOKIE_KEY_USER_TOKEN);
  }

  httpGet<T extends HttpResponseEntity>(
    url: string,
    param: Record<string, any> = {},
    showMessage = false
  ): Observable<T> {
    return this.http
      .get<T>(this.getApiUrl(url), {
        params: new HttpParams({
          fromObject: param
        }),
        observe: 'body'
      })
      .pipe(catchError(this.handleError<T>(showMessage)));
  }

  httpPost<T extends HttpResponseEntity>(
    url: string,
    body: Record<string, any> | FormData = {},
    showMessage = false
  ): Observable<T> {
    return this.http
      .post<T>(this.getApiUrl(url), body, {
        observe: 'body'
      })
      .pipe(catchError(this.handleError<T>(showMessage)));
  }

  private handleError<T>(showMessage = false) {
    return (err: HttpErrorResponse): Observable<T> => {
      // if (showMessage) {
      //   this.message.error(err.error?.message || err.message || Message.UNKNOWN_ERROR);
      // }
      // Let the app keep running by returning an empty result.
      return of(err.error as T);
    };
  }
}
