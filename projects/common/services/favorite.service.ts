import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, HttpResponseEntity } from 'common/core';
import { FavoriteType } from 'common/enums';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  constructor(private readonly apiService: ApiService) {}

  addFavorite(targetId: string, type = FavoriteType.POST): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(
        ApiUrl.FAVORITE,
        {
          targetId,
          type
        },
        true
      )
      .pipe(map((res) => res || {}));
  }
}
