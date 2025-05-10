import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { Message } from 'src/app/config/message.enum';
import { HttpResponseEntity } from 'src/app/interfaces/http-response';
import { environment } from 'src/environments/environment';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly message: MessageService
  ) {}

  getApiUrl(path: string): string {
    return `${environment.apiBase}${path}`;
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
    showMessage = true
  ): Observable<T> {
    return this.http
      .post<T>(this.getApiUrl(url), body, {
        observe: 'body'
      })
      .pipe(catchError(this.handleError<T>(showMessage)));
  }

  httpGetFile(url: string, param: Record<string, any> = {}, showMessage = false): Observable<Blob> {
    return this.http
      .get(this.getApiUrl(url), {
        params: new HttpParams({
          fromObject: param
        }),
        responseType: 'blob',
        observe: 'body'
      })
      .pipe(catchError(this.handleError<Blob>(showMessage)));
  }

  private handleError<T>(showMessage = false) {
    return (err: HttpErrorResponse): Observable<T> => {
      if (showMessage) {
        this.message.error(err.error?.message || err.message || Message.UNKNOWN_ERROR);
      }
      // Let the app keep running by returning an empty result.
      return of(err.error as T);
    };
  }
}
