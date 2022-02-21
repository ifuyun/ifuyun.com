import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from '../core/base-api.service';
import { ApiUrl } from '../enums/api-url';
import { OptionEntity } from '../interfaces/options';

@Injectable({
  providedIn: 'root'
})
export class OptionsService extends BaseApiService {
  constructor(
    protected http: HttpClient,
    protected message: NzMessageService
  ) {
    super();
  }

  getOptions(): Observable<OptionEntity> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_OPTIONS)).pipe(
      map((res) => res.data || {})
    );
  }
}
