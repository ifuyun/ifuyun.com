import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService, ResultList } from 'common/core';
import {
  AllSearchResponse,
  GameSearchResponse,
  PostSearchResponse,
  SearchParam,
  WallpaperSearchResponse
} from 'common/interfaces';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  constructor(
    private readonly apiService: ApiService,
    private readonly appConfigService: AppConfigService
  ) {}

  searchAll(param: SearchParam): Observable<ResultList<AllSearchResponse>> {
    return this.apiService
      .httpGet(ApiUrl.SEARCH_ALL, {
        ...param,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }

  searchPosts(param: SearchParam): Observable<ResultList<PostSearchResponse>> {
    return this.apiService
      .httpGet(ApiUrl.SEARCH_POSTS, {
        ...param,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }

  searchWallpapers(param: SearchParam): Observable<ResultList<WallpaperSearchResponse>> {
    return this.apiService
      .httpGet(ApiUrl.SEARCH_WALLPAPERS, {
        ...param,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }

  searchGames(param: SearchParam): Observable<ResultList<GameSearchResponse>> {
    return this.apiService
      .httpGet(ApiUrl.SEARCH_GAMES, {
        ...param,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }
}
