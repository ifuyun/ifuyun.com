import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService } from 'common/core';
import { FavoriteLink, LinkEntity } from 'common/interfaces';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LinkService {
  constructor(
    private readonly apiService: ApiService,
    private readonly appConfigService: AppConfigService
  ) {}

  getFriendLinks(isHome: boolean): Observable<LinkEntity[]> {
    return this.apiService
      .httpGet(ApiUrl.LINK_FRIEND, {
        isHome,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || []));
  }

  getFavoriteLinks(): Observable<FavoriteLink[]> {
    return this.apiService
      .httpGet(ApiUrl.LINK_FAVORITE, {
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || []));
  }

  getFooterLinks(): Observable<LinkEntity[]> {
    return this.apiService
      .httpGet(ApiUrl.LINK_FOOTER, {
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || []));
  }
}
