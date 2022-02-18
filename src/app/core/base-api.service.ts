import { BaseService } from './base.service';
import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ApiUrl } from '../enums/api-url';
import { HttpResponseEntity } from '../interfaces/http-response';

export abstract class BaseApiService extends BaseService {
  protected apiUrlPrefix: string = ApiUrl.API_URL_PREFIX;
  protected abstract http: HttpClient;

  protected getApiUrl(path: string): string {
    return `${this.apiUrlPrefix}${path}`;
  }

  protected getApiUrlWithParam(path: string, ...args: string[]) {
    let idx = 0;
    return path.replace(/(:[a-zA-Z0-9\-_]+)/ig, (matched) => {
      return args[idx++] || matched;
    });
  }

  protected handleError(error: HttpErrorResponse): never {
    throw error;
  }

  protected httpGet<T extends HttpResponseEntity>(url: string, param: Record<string, any> = {}): Observable<T> {
    return this.http.get<T>(url, {
      params: new HttpParams({
        fromObject: param
      }),
      observe: 'body'
    }).pipe(
      // todo: res.code not equal 0(=success)
      map((res) => res),
      catchError((err) => this.handleError(err))
    );
  }

  protected httpGetData<T extends HttpResponseEntity>(url: string, param: Record<string, any> = {}): Observable<any> {
    return this.http.get<T>(url, {
      params: new HttpParams({
        fromObject: param
      }),
      observe: 'body'
    }).pipe(
      // todo: res.code not equal 0(=success)
      map((res) => res.data),
      catchError((err) => this.handleError(err))
    );
  }

  protected httpPost<T extends HttpResponseEntity>(url: string, body: Record<string, any> | FormData = {}): Observable<any> {
    return this.http.post<T>(url, body, {
      observe: 'body'
    }).pipe(
      map((res) => res.data),
      catchError((err) => this.handleError(err))
    );
  }
}
