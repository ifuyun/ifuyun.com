import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
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
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_LINKS_OF_FRIEND), {
        isHome
      })
      .pipe(map((res) => res?.data || []));
  }

  getFavoriteLinks(): Observable<FavoriteLink[]> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_LINKS_OF_FAVORITE))
      .pipe(map((res) => res?.data || []));
  }
}
