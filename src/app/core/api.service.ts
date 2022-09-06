import { HttpClient, HttpErrorResponse, HttpParams, HttpStatusCode } from '@angular/common/http';
import { Inject, Injectable, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { RESPONSE } from '@nguniversal/express-engine/tokens';
import { Response } from 'express';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MessageService } from '../components/message/message.service';
import { ApiUrl } from '../config/api-url';
import { Message } from '../config/message.enum';
import { HttpResponseEntity } from '../interfaces/http-response';
import { PlatformService } from './platform.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrlPrefix: string = ApiUrl.API_URL_PREFIX;

  constructor(
    private http: HttpClient,
    private message: MessageService,
    private router: Router,
    private platform: PlatformService,
    @Optional() @Inject(RESPONSE) private response: Response
  ) {}

  getApiUrl(path: string): string {
    return `${this.apiUrlPrefix}${path}`;
  }

  getApiUrlWithParam(path: string, ...args: string[]): string {
    let idx = 0;
    return (
      this.apiUrlPrefix +
      path.replace(/(:[a-zA-Z0-9\-_]+)/gi, (matched) => {
        return args[idx++] || matched;
      })
    );
  }

  private handleError<T>() {
    return (error: HttpErrorResponse): Observable<T> => {
      if (error.status !== HttpStatusCode.NotFound) {
        this.message.error(error.error?.message || error.message || Message.UNKNOWN_ERROR);
        // Let the app keep running by returning an empty result.
        return of(error.error as T);
      }
      if (this.platform.isBrowser) {
        this.router.navigate(['404']);
      } else {
        this.response.redirect('/404');
      }
      return EMPTY;
    };
  }

  httpGet<T extends HttpResponseEntity>(url: string, param: Record<string, any> = {}): Observable<T> {
    return this.http
      .get<T>(url, {
        params: new HttpParams({
          fromObject: param
        }),
        observe: 'body'
      })
      .pipe(catchError(this.handleError<T>()));
  }

  httpGetData<T extends HttpResponseEntity>(url: string, param: Record<string, any> = {}): Observable<any> {
    return this.http
      .get<T>(url, {
        params: new HttpParams({
          fromObject: param
        }),
        observe: 'body'
      })
      .pipe(
        map((res) => res?.data),
        catchError(this.handleError<T>())
      );
  }

  httpPost<T extends HttpResponseEntity>(url: string, body: Record<string, any> | FormData = {}): Observable<T> {
    return this.http
      .post<T>(url, body, {
        observe: 'body'
      })
      .pipe(catchError(this.handleError<T>()));
  }
}
