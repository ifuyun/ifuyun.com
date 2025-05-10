import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from 'src/app/config/api-url';
import { APP_ID } from 'src/app/config/common.constant';
import { ResultList } from 'src/app/interfaces/common';
import {
  AllSearchResponse,
  GameSearchResponse,
  PostSearchResponse,
  SearchParam,
  WallpaperSearchResponse
} from 'src/app/interfaces/search';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  constructor(private readonly apiService: ApiService) {}

  searchAll(param: SearchParam): Observable<ResultList<AllSearchResponse>> {
    return this.apiService
      .httpGet(ApiUrl.SEARCH_ALL, {
        ...param,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }

  searchPosts(param: SearchParam): Observable<ResultList<PostSearchResponse>> {
    return this.apiService
      .httpGet(ApiUrl.SEARCH_POSTS, {
        ...param,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }

  searchWallpapers(param: SearchParam): Observable<ResultList<WallpaperSearchResponse>> {
    return this.apiService
      .httpGet(ApiUrl.SEARCH_WALLPAPERS, {
        ...param,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }

  searchGames(param: SearchParam): Observable<ResultList<GameSearchResponse>> {
    return this.apiService
      .httpGet(ApiUrl.SEARCH_GAMES, {
        ...param,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }
}
