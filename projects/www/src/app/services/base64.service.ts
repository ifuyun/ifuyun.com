import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, HttpResponseEntity } from 'common/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Base64Service {
  constructor(private readonly apiService: ApiService) {}

  transform(text: string, action: 'encode' | 'decode'): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(ApiUrl.TOOL_BASE64, {
        text,
        action
      })
      .pipe(map((res) => res || {}));
  }
}
