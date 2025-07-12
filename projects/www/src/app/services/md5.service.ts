import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, HttpResponseEntity } from 'common/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Md5Service {
  constructor(private readonly apiService: ApiService) {}

  transform(text: string): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(ApiUrl.TOOL_MD5, {
        text
      })
      .pipe(map((res) => res || {}));
  }
}
