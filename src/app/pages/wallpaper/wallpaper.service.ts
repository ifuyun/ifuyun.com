import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

  checkWallpaperLikedStatus<T extends Wallpaper[]>(wallpapers: T): T {
    const likedWallpapers = (localStorage.getItem(STORAGE_KEY_LIKED_WALLPAPER) || '').split(',');
    return wallpapers.map((item) => ({
      ...item,
      liked: likedWallpapers.includes(item.wallpaperId)
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
      const year = item.dateValue.split('/')[0];
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
