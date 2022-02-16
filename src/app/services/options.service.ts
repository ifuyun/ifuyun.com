import { Injectable } from '@angular/core';
import { BaseApiService } from '../core/base-api.service';
import { HttpClient } from '@angular/common/http';
import { ApiUrl } from '../enums/api-url';

@Injectable({
  providedIn: 'root'
})
export class OptionsService extends BaseApiService {
  constructor(private http: HttpClient) {
    super(http);
  }

  getOptions() {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_OPTIONS));
  }
}
