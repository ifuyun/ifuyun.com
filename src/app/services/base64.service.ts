import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { HttpResponseEntity } from '../interfaces/http-response';
import { ApiService } from './api.service';

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
