import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams, HttpStatusCode } from '@angular/common/http';
import { Router } from '@angular/router';
import { Response } from 'express';
import { NzMessageService } from 'ng-zorro-antd/message';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiUrl } from '../enums/api-url';
import { Message } from '../enums/message.enum';
import { HttpResponseEntity } from '../interfaces/http-response';
import { BaseService } from './base.service';

export abstract class BaseApiService extends BaseService {
  protected apiUrlPrefix: string = ApiUrl.API_URL_PREFIX;
  protected abstract http: HttpClient;
  protected abstract message: NzMessageService;
  protected abstract router: Router;
  protected abstract platform: Object;
  protected abstract response: Response;

  protected getApiUrl(path: string): string {
    return `${this.apiUrlPrefix}${path}`;
  }

  protected getApiUrlWithParam(path: string, ...args: string[]): string {
    let idx = 0;
    return this.apiUrlPrefix + path.replace(/(:[a-zA-Z0-9\-_]+)/ig, (matched) => {
      return args[idx++] || matched;
    });
  }

  protected handleError<T>() {
    return (error: HttpErrorResponse): Observable<T> => {
      if (error.status !== HttpStatusCode.NotFound) {
        this.message.error(error.error?.message || error.message || Message.UNKNOWN_ERROR);
        // Let the app keep running by returning an empty result.
        return of(error.error as T);
      }
      if (isPlatformBrowser(this.platform)) {
        this.router.navigate(['404']);
      } else {
        this.response.redirect('/404');
      }
      return EMPTY;
    };
  }

  protected httpGet<T extends HttpResponseEntity>(url: string, param: Record<string, any> = {}): Observable<T> {
    return this.http.get<T>(url, {
      params: new HttpParams({
        fromObject: param
      }),
      observe: 'body'
    }).pipe(
      catchError(this.handleError<T>())
    );
  }

  protected httpGetData<T extends HttpResponseEntity>(url: string, param: Record<string, any> = {}): Observable<any> {
    return this.http.get<T>(url, {
      params: new HttpParams({
        fromObject: param
      }),
      observe: 'body'
    }).pipe(
      map((res) => res?.data),
      catchError(this.handleError<T>())
    );
  }

  protected httpPost<T extends HttpResponseEntity>(url: string, body: Record<string, any> | FormData = {}): Observable<T> {
    return this.http.post<T>(url, body, {
      observe: 'body'
    }).pipe(
      catchError(this.handleError<T>())
    );
  }
}
