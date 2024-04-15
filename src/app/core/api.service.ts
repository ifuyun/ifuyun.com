import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, EMPTY, map, Observable, of } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { Message } from '../config/message.enum';
import { CommonService } from './common.service';
import { HttpResponseEntity } from './http-response.interface';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrlPrefix: string = ApiUrl.API_URL_PREFIX;

  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private message: MessageService
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

  httpGet<T extends HttpResponseEntity>(
    url: string,
    param: Record<string, any> = {},
    disableMessage = true
  ): Observable<T> {
    return this.http
      .get<T>(url, {
        params: new HttpParams({
          fromObject: param
        }),
        observe: 'body'
      })
      .pipe(catchError(this.handleError<T>(disableMessage)));
  }

  httpGetData<T extends HttpResponseEntity>(
    url: string,
    param: Record<string, any> = {},
    disableMessage = true
  ): Observable<any> {
    return this.http
      .get<T>(url, {
        params: new HttpParams({
          fromObject: param
        }),
        observe: 'body'
      })
      .pipe(
        map((res) => res?.data),
        catchError(this.handleError<T>(disableMessage))
      );
  }

  downloadFile(url: string, param: Record<string, any> = {}): Observable<HttpResponse<Blob>> {
    return this.http.get(url, {
      params: new HttpParams({
        fromObject: param
      }),
      observe: 'response',
      responseType: 'blob'
    });
  }

  httpPost<T extends HttpResponseEntity>(
    url: string,
    body: Record<string, any> | FormData = {},
    disableMessage = true
  ): Observable<T> {
    return this.http
      .post<T>(url, body, {
        observe: 'body'
      })
      .pipe(catchError(this.handleError<T>(disableMessage)));
  }

  private handleError<T>(disableMessage = true) {
    return (error: HttpErrorResponse): Observable<T> => {
      if (error.status !== HttpStatusCode.NotFound) {
        if (!disableMessage) {
          this.message.error(error.error?.message || error.message || Message.UNKNOWN_ERROR);
        }
        // Let the app keep running by returning an empty result.
        return of(error.error as T);
      }
      this.commonService.redirectToNotFound();
      return EMPTY;
    };
  }
}
