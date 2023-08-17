import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from '../../config/api-url';
import { STORAGE_KEY_LIKED_WALLPAPER } from '../../config/common.constant';
import { ApiService } from '../../core/api.service';
import { ArchiveData, ArchiveDataMap, ArchiveList, ResultList } from '../../core/common.interface';
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

  getRandomWallpapers(size: number, remote = 1, resolution = '1920x1080'): Observable<Wallpaper[]> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_WALLPAPERS_BY_RANDOM), { size, remote, resolution })
      .pipe(map((res) => res?.data || []));
  }

  getWallpaperById(wallpaperId: string): Observable<Wallpaper> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_WALLPAPER_BY_ID), { wallpaperId })
      .pipe(map((res) => res?.data || {}));
  }

  downloadWallpaper(wallpaperId: string, isUhd: boolean): Observable<HttpResponse<Blob>> {
    return this.apiService
      .downloadFile(this.apiService.getApiUrl(ApiUrl.DOWNLOAD_WALLPAPER), {
        wallpaperId,
        uhd: isUhd ? 1 : 0
      });
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
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_WALLPAPER_ARCHIVES), {
        showCount: showCount ? 1 : 0,
        limit
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
