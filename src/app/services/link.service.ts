import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../config/api-url';
import { APP_ID } from '../config/common.constant';
import { FavoriteLink, LinkEntity } from '../interfaces/link';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class LinkService {
  constructor(private readonly apiService: ApiService) {}

  getFriendLinks(isHome: boolean): Observable<LinkEntity[]> {
    return this.apiService
      .httpGet(ApiUrl.LINK_FRIEND, {
        isHome,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || []));
  }

  getFavoriteLinks(): Observable<FavoriteLink[]> {
    return this.apiService
      .httpGet(ApiUrl.LINK_FAVORITE, {
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || []));
  }

  getFooterLinks(): Observable<LinkEntity[]> {
    return this.apiService
      .httpGet(ApiUrl.LINK_FOOTER, {
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || []));
  }
}
