import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../config/api-url';
import { APP_ID } from '../config/common.constant';
import { ArchiveData, ArchiveDataMap, ArchiveList, ResultList } from '../interfaces/common';
import {
  HotWallpaper,
  PrevAndNextWallpapers,
  Wallpaper,
  WallpaperQueryParam,
  WallpaperRelatedParam,
  WallpaperSearchItem
} from '../interfaces/wallpaper';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class WallpaperService {
  private activeWallpaperId: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public activeWallpaperId$: Observable<string> = this.activeWallpaperId.asObservable();

  constructor(private readonly apiService: ApiService) {}

  getWallpapers(param: WallpaperQueryParam): Observable<ResultList<Wallpaper>> {
    return this.apiService
      .httpGet(ApiUrl.WALLPAPERS, {
        ...param,
        appId: APP_ID
      })
      .pipe(
        map((res) => {
          if (!res?.data) {
            return {};
          }
          return {
            ...res.data,
            list: res.data.list.map((item: Wallpaper) => this.transformWallpaper(item))
          };
        })
      );
  }

  getHotWallpapers(size: number): Observable<HotWallpaper[]> {
    return this.apiService
      .httpGet(ApiUrl.WALLPAPER_HOT, {
        size,
        appId: APP_ID
      })
      .pipe(
        map((res) => {
          return (res?.data || []).map((item: HotWallpaper) => {
            return {
              ...item,
              wallpaperTitle: item.wallpaperTitleCn || item.wallpaperTitleEn,
              wallpaperCopyright: item.wallpaperCopyrightCn || item.wallpaperCopyrightEn,
              isCn: !!item.wallpaperCopyrightCn,
              isEn: !!item.wallpaperCopyrightEn
            };
          });
        })
      );
  }

  getRandomWallpapers(size: number, simple?: boolean, resolution?: string): Observable<Wallpaper[]> {
    const payload: Record<string, any> = {
      size,
      simple: simple ? 1 : 0,
      appId: APP_ID
    };
    if (resolution) {
      payload['resolution'] = resolution;
    }

    return this.apiService.httpGet(ApiUrl.WALLPAPER_RANDOM, payload).pipe(
      map((res) => {
        return (res?.data || []).map((item: Wallpaper) => {
          return {
            ...item,
            wallpaperTitle: item.wallpaperTitle || item.wallpaperTitleEn,
            wallpaperCopyright: item.wallpaperCopyright || item.wallpaperCopyrightEn,
            isCn: !!item.wallpaperCopyright,
            isEn: !!item.wallpaperCopyrightEn
          };
        });
      })
    );
  }

  getRelatedWallpapers(param: WallpaperRelatedParam): Observable<WallpaperSearchItem[]> {
    return this.apiService
      .httpGet(ApiUrl.WALLPAPER_RELATED, { ...param, appId: APP_ID })
      .pipe(map((res) => res?.data || []));
  }

  getWallpaperArchives(showCount = false, limit = 10): Observable<ArchiveData[]> {
    return this.apiService
      .httpGet(ApiUrl.WALLPAPER_ARCHIVES, {
        showCount: showCount ? 1 : 0,
        limit,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data?.archives || []));
  }

  getWallpaperById(wallpaperId: string, jigsaw = false): Observable<Wallpaper> {
    return this.apiService
      .httpGet(ApiUrl.WALLPAPER, {
        wallpaperId,
        jigsaw: jigsaw ? 1 : 0,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data));
  }

  getWallpapersOfPrevAndNext(wallpaperId: string): Observable<PrevAndNextWallpapers> {
    return this.apiService
      .httpGet(ApiUrl.WALLPAPER_PREV_AND_NEXT, {
        wallpaperId,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }

  updateActiveWallpaperId(wallpaperId: string) {
    this.activeWallpaperId.next(wallpaperId);
  }

  getWallpaperDownloadUrl(wallpaperId: string, uhd: 0 | 1): Observable<string> {
    return this.apiService
      .httpGet(
        ApiUrl.WALLPAPER_DOWNLOAD_URL,
        {
          wallpaperId,
          uhd
        },
        true
      )
      .pipe(map((res) => res?.data || ''));
  }

  transformWallpaper(wallpaper: Wallpaper): Wallpaper {
    return {
      ...wallpaper,
      wallpaperTitle: wallpaper.wallpaperTitle || wallpaper.wallpaperTitleEn,
      wallpaperTitleEn: wallpaper.wallpaperTitleEn || wallpaper.wallpaperTitle,
      wallpaperCopyright: wallpaper.wallpaperCopyright || wallpaper.wallpaperCopyrightEn,
      wallpaperCopyrightEn: wallpaper.wallpaperCopyrightEn || wallpaper.wallpaperCopyright,
      wallpaperLocation: wallpaper.wallpaperLocation || wallpaper.wallpaperLocationEn || '未知',
      wallpaperLocationEn: wallpaper.wallpaperLocationEn || wallpaper.wallpaperLocation || 'Unknown',
      wallpaperStory: wallpaper.wallpaperStory || wallpaper.wallpaperStoryEn,
      wallpaperStoryEn: wallpaper.wallpaperStoryEn || wallpaper.wallpaperStory,
      isCn: !!wallpaper.wallpaperCopyright,
      isEn: !!wallpaper.wallpaperCopyrightEn
    };
  }

  getWallpaperLink(wallpaperId: string, isEn: boolean) {
    return `/wallpaper/${wallpaperId}${isEn ? '?lang=en' : ''}`;
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
