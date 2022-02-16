import { BaseService } from './base.service';
import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { HttpResponseEntity } from '../interfaces/http-response';
import { ApiUrl } from '../enums/api-url';

export abstract class BaseApiService extends BaseService {
  protected apiUrlPrefix: string = ApiUrl.API_URL_PREFIX;
  private httpClient: HttpClient;

  protected constructor(httpClient: HttpClient) {
    super();
    this.httpClient = httpClient;
  }

  protected getApiUrl(path: string): string {
    return `${this.apiUrlPrefix}${path}`;
  }

  protected getApiUrlWithParam(path: string, ...args: string[]) {
    let idx = 0;
    return path.replace(/(:[a-zA-Z0-9\-_]+)/ig, (matched) => {
      return args[idx++] || matched;
    });
  }

  protected handleResponse<T extends HttpResponseEntity>(response: HttpResponse<T>): any {
    const body = response.body;
    if (body === null) {
      return {};
    }
    return body.data || {};
  }

  protected handleError(error: HttpErrorResponse): never {
    throw error;
  }

  protected httpGet<T extends HttpResponseEntity>(url: string, param?: any): Observable<any> {
    param = param || {};
    return this.httpClient.get<T>(url, {
      params: new HttpParams({
        fromObject: param as { [key: string]: string | string[] }
      }),
      observe: 'response'
    }).pipe(
      map((res) => this.handleResponse(res)),
      catchError((err) => this.handleError(err))
    );
  }
}
