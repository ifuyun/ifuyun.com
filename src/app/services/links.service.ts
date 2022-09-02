import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { ApiUrl } from '../config/api-url';
import { LinkEntity } from '../interfaces/links';

@Injectable({
  providedIn: 'root'
})
export class LinksService {
  constructor(private apiService: ApiService) {}

  getFriendLinks(isHome: boolean): Observable<LinkEntity[]> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_LINKS_OF_FRIEND), {
        isHome
      })
      .pipe(map((res) => res?.data || []));
  }
}
