import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../../config/api-url';
import { ApiService } from '../../core/api.service';
import { BingWallpaper, BingWallpaperQueryParam, WallpaperList, WallpaperQueryParam } from './wallpaper.interface';

@Injectable({
  providedIn: 'root'
})
export class WallpaperService {
  constructor(private apiService: ApiService) {}

  getBingWallpapers(param: Partial<BingWallpaperQueryParam>): Observable<BingWallpaper[]> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_BING_WALLPAPERS), param)
      .pipe(map((res) => res?.data || []));
  }

  getWallpapers(param: WallpaperQueryParam): Observable<WallpaperList> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_WALLPAPERS), param)
      .pipe(map((res) => res?.data || {}));
  }
}
