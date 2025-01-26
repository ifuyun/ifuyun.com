import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { APP_ID } from '../config/common.constant';
import { FavoriteType } from '../enums/favorite';
import { HttpResponseEntity } from '../interfaces/http-response';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  constructor(private readonly apiService: ApiService) {}

  addFavorite(objectId: string, objectType = FavoriteType.POST): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(
        ApiUrl.FAVORITE,
        {
          objectId,
          type: objectType,
          appId: APP_ID
        },
        true
      )
      .pipe(map((res) => res || {}));
  }
}
