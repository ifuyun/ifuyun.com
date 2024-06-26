import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { APP_ID } from '../config/common.constant';
import { ApiService } from '../core/api.service';
import { FavoriteType } from '../interfaces/favorite.enum';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  constructor(private apiService: ApiService) {}

  addFavorite(objectId: string, objectType = FavoriteType.POST): Observable<boolean> {
    return this.apiService
      .httpPost(
        this.apiService.getApiUrl(ApiUrl.FAVORITE),
        {
          objectId,
          type: objectType,
          appId: APP_ID
        },
        false
      )
      .pipe(map((res) => res?.data || false));
  }
}
