import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from '../../config/api-url';
import { APP_ID, STORAGE_KEY_LIKED_WALLPAPER } from '../../config/common.constant';
import { ApiService } from '../../core/api.service';
import { ArchiveData, ArchiveDataMap, ArchiveList, ResultList } from '../../core/common.interface';
import { HttpResponseEntity } from '../../core/http-response.interface';
import { HotWallpaper, Wallpaper, WallpaperLang, WallpaperQueryParam } from './wallpaper.interface';

@Injectable({
  providedIn: 'root'
})
export class WallpaperService {
  constructor(private apiService: ApiService) {}

  getWallpapers(param: WallpaperQueryParam): Observable<ResultList<Wallpaper>> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.WALLPAPER_LIST), param)
      .pipe(map((res) => res?.data || {}));
  }

  getRandomWallpapers(param: {
    size: number;
    resolution?: string;
    simple?: boolean
  }): Observable<Wallpaper[]> {
    const { size, resolution, simple } = param;
    const payload: Record<string, any> = {
      size,
      simple: simple ? 1 : 0,
      appId: APP_ID
    };
    if (resolution) {
      payload['resolution'] = resolution;
    }

    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.WALLPAPER_RANDOM), payload)
      .pipe(map((res) => res?.data || []));
  }

  getHotWallpapers(): Observable<HotWallpaper[]> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.WALLPAPER_HOT), {
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || []));
  }

  getWallpaperById(wallpaperId: string): Observable<Wallpaper> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.WALLPAPER), {
        wallpaperId,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }

  downloadWallpaper(wallpaperId: string, isUhd: boolean): Observable<HttpResponse<Blob>> {
    return this.apiService.downloadFile(this.apiService.getApiUrl(ApiUrl.WALLPAPER_DOWNLOAD), {
      wallpaperId,
      uhd: isUhd ? 1 : 0,
      appId: APP_ID
    });
  }

  getWallpapersOfPrevAndNext(
    wallpaperId: string,
    lang: WallpaperLang
  ): Observable<{ prevWallpaper: Wallpaper; nextWallpaper: Wallpaper }> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.WALLPAPER_PREV_AND_NEXT), {
        wallpaperId,
        lang,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }

  checkWallpaperVoteStatus<T extends Wallpaper | Wallpaper[]>(wallpapers: T): T {
    const voted = (localStorage.getItem(STORAGE_KEY_LIKED_WALLPAPER) || '').split(',');
    if (!Array.isArray(wallpapers)) {
      return {
        ...wallpapers,
        wallpaperVoted: voted.includes(wallpapers.wallpaperId)
      };
    }
    return wallpapers.map((item) => ({
      ...item,
      wallpaperVoted: voted.includes(item.wallpaperId)
    })) as T;
  }

  getWallpaperArchives({ showCount = false, limit = 10 }): Observable<ArchiveData[]> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.WALLPAPER_ARCHIVES), {
        showCount: showCount ? 1 : 0,
        limit,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data?.archives || []));
  }

  transformArchives(archiveData: ArchiveData[]): ArchiveList {
    const dateList: ArchiveDataMap = {};
    (archiveData || []).forEach((item) => {
      const dates = item.dateValue.split('/');
      const year = dates[0];
      item.dateLabel = `${Number(dates[1])}月`;
      dateList[year] = dateList[year] || {};
      dateList[year].list = dateList[year].list || [];
      dateList[year].list.push(item);
      dateList[year].countByYear = dateList[year].countByYear || 0;
      dateList[year].countByYear += item.count || 0;
    });
    const yearList = Object.keys(dateList).sort((a, b) => (a < b ? 1 : -1));

    return {
      dateList,
      yearList
    };
  }
}
