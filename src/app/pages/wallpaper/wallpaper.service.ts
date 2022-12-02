import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../../config/api-url';
import { ApiService } from '../../core/api.service';
import { ResultList } from '../../core/common.interface';
import { HttpResponseEntity } from '../../core/http-response.interface';
import { Wallpaper, WallpaperLang, WallpaperQueryParam } from './wallpaper.interface';

@Injectable({
  providedIn: 'root'
})
export class WallpaperService {
  constructor(private apiService: ApiService) {}

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

  getWallpaperById(wallpaperId: string): Observable<Wallpaper> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_WALLPAPER_BY_ID), { wallpaperId })
      .pipe(map((res) => res?.data || {}));
  }

  getDownloadUrl(wallpaperId: string, isUhd: boolean): string {
    return `${this.apiService.getApiUrl(ApiUrl.DOWNLOAD_WALLPAPER)}?wallpaperId=${wallpaperId}&uhd=${isUhd ? 1 : 0}`;
  }

  increaseDownload(wallpaperId: string): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.DOWNLOAD_WALLPAPER), { wallpaperId });
  }

  getWallpapersOfPrevAndNext(
    wallpaperId: string,
    lang: WallpaperLang
  ): Observable<{ prevWallpaper: Wallpaper; nextWallpaper: Wallpaper }> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_WALLPAPERS_OF_PREV_AND_NEXT), {
        wallpaperId,
        lang
      })
      .pipe(map((res) => res?.data || {}));
  }

  parseLocation(wallpaper: Wallpaper, lang: WallpaperLang): { copyright: string; location: string } {
    const isCn = lang === WallpaperLang.CN && !!wallpaper.copyright || lang === WallpaperLang.EN && !wallpaper.copyrightEn;
    const separator = isCn ? '，' : /,\s*/i;
    const copyright = isCn ? wallpaper.copyright : wallpaper.copyrightEn;
    const temp = copyright.split(separator);
    if (temp.length < 2) {
      return {
        copyright,
        location: '未知'
      };
    }
    return {
      copyright: temp.shift() || '',
      location: temp.join(isCn ? '，' : ', ')
    };
  }
}
