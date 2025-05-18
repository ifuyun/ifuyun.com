import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService, HttpResponseEntity } from 'common/core';
import { FavoriteType } from 'common/enums';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  constructor(
    private readonly apiService: ApiService,
    private readonly appConfigService: AppConfigService
  ) {}

  addFavorite(objectId: string, objectType = FavoriteType.POST): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(
        ApiUrl.FAVORITE,
        {
          objectId,
          type: objectType,
          appId: this.appConfigService.appId
        },
        true
      )
      .pipe(map((res) => res || {}));
  }
}
