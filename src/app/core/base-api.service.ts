import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiUrl } from '../enums/api-url';
import { HttpResponseEntity } from '../interfaces/http-response';
import { BaseService } from './base.service';

export abstract class BaseApiService extends BaseService {
  protected apiUrlPrefix: string = ApiUrl.API_URL_PREFIX;
  protected abstract http: HttpClient;
  protected abstract message: NzMessageService;

  protected getApiUrl(path: string): string {
    return `${this.apiUrlPrefix}${path}`;
  }

  protected getApiUrlWithParam(path: string, ...args: string[]) {
    let idx = 0;
    return path.replace(/(:[a-zA-Z0-9\-_]+)/ig, (matched) => {
      return args[idx++] || matched;
    });
  }

  protected handleError<T>() {
    return (error: HttpErrorResponse): Observable<T> => {
      this.message.error(error.error.message || error.message);

      // Let the app keep running by returning an empty result.
      return of(error.error as T);
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
      map((res) => res.data),
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
