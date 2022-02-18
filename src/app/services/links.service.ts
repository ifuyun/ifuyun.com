import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from '../core/base-api.service';
import { ApiUrl } from '../enums/api-url';
import { LinkEntity } from '../interfaces/links';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LinksService extends BaseApiService{
  constructor(protected http: HttpClient) {
    super();
  }

  getQuickLinks(): Observable<LinkEntity[]> {
    return this.httpGetData(this.getApiUrl(ApiUrl.GET_LINKS_OF_QUICK));
  }
}
