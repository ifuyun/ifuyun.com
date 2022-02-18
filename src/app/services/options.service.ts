import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from '../core/base-api.service';
import { ApiUrl } from '../enums/api-url';
import { OptionEntity } from '../interfaces/options';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OptionsService extends BaseApiService {
  constructor(protected http: HttpClient) {
    super();
  }

  getOptions(): Observable<OptionEntity> {
    return this.httpGetData(this.getApiUrl(ApiUrl.GET_OPTIONS));
  }
}
