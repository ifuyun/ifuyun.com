import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { APP_ID } from '../config/common.constant';
import { ApiService } from '../core/api.service';
import { ApiUrl } from '../config/api-url';
import { FavoriteLink, LinkEntity } from '../interfaces/link.interface';

@Injectable({
  providedIn: 'root'
})
export class LinkService {
  constructor(private apiService: ApiService) {}

  getFriendLinks(isHome: boolean): Observable<LinkEntity[]> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.LINK_FRIEND), {
        isHome,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || []));
  }

  getFavoriteLinks(): Observable<FavoriteLink[]> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.LINK_FAVORITE), {
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || []));
  }

  getFooterLinks(): Observable<LinkEntity[]> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.LINK_FOOTER), {
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || []));
  }
}
