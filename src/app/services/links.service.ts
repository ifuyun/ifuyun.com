import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { RESPONSE } from '@nguniversal/express-engine/tokens';
import { Response } from 'express';
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
    protected router: Router,
    protected message: NzMessageService,
    @Inject(PLATFORM_ID) protected platform: Object,
    @Optional() @Inject(RESPONSE) protected response: Response
  ) {
    super();
  }

  getQuickLinks(): Observable<LinkEntity[]> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_LINKS_OF_QUICK)).pipe(
      map((res) => res?.data || [])
    );
  }

  getFriendLinks(isHome: boolean): Observable<LinkEntity[]> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_LINKS_OF_FRIEND), {
      isHome
    }).pipe(
      map((res) => res?.data || [])
    );
  }
}
