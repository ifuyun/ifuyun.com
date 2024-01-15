import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from '../../../config/api-url';
import { ApiService } from '../../../core/api.service';
import { HttpResponseEntity } from '../../../core/http-response.interface';

@Injectable({
  providedIn: 'root'
})
export class Base64Service {
  constructor(private apiService: ApiService) {}

  transform(text: string, action: 'encode' | 'decode'): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(this.apiService.getApiUrl(ApiUrl.TOOL_BASE64), {
        text,
        action
      })
      .pipe(map((res) => res || {}));
  }
}
