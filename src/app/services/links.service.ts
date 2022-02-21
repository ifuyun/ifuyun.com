import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from '../core/base-api.service';
import { ApiUrl } from '../enums/api-url';
import { LinkEntity } from '../interfaces/links';

@Injectable({
  providedIn: 'root'
})
export class LinksService extends BaseApiService {
  constructor(
    protected http: HttpClient,
    protected message: NzMessageService
  ) {
    super();
  }

  getQuickLinks(): Observable<LinkEntity[]> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_LINKS_OF_QUICK)).pipe(
      map((res) => res.data || [])
    );
  }
}
