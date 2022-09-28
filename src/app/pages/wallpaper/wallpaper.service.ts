import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../../config/api-url';
import { ApiService } from '../../core/api.service';
import { ResultList } from '../../core/common.interface';
import { BingWallpaperQueryParam, Wallpaper, WallpaperQueryParam } from './wallpaper.interface';

@Injectable({
  providedIn: 'root'
})
export class WallpaperService {
  constructor(private apiService: ApiService) {}

  getBingWallpapers(param: Partial<BingWallpaperQueryParam>): Observable<Wallpaper[]> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_BING_WALLPAPERS), param)
      .pipe(map((res) => res?.data || []));
  }

  getWallpapers(param: WallpaperQueryParam): Observable<ResultList<Wallpaper>> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_WALLPAPERS), param)
      .pipe(map((res) => res?.data || {}));
  }

  getRandomWallpapers(size: number): Observable<Wallpaper[]> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_WALLPAPERS_BY_RANDOM), { size })
      .pipe(map((res) => res?.data || []));
  }

  getWallpaperById(wid: string): Observable<Wallpaper> {
    return this.apiService
      .httpGet(this.apiService.getApiUrlWithParam(ApiUrl.GET_WALLPAPER_BY_ID, wid))
      .pipe(map((res) => res?.data || {}));
  }

  getDownloadUrl(wallpaperId: string, isUhd: boolean): string {
    return `${this.apiService.getApiUrl(ApiUrl.DOWNLOAD_WALLPAPER)}?wallpaperId=${wallpaperId}&uhd=${isUhd ? 1 : 0}`;
  }
}
