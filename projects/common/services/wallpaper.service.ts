import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService, ArchiveData, ResultList } from 'common/core';
import {
  HotWallpaper,
  PrevAndNextWallpapers,
  Wallpaper,
  WallpaperQueryParam,
  WallpaperRelatedParam,
  WallpaperSearchItem
} from 'common/interfaces';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WallpaperService {
  private activeWallpaperId: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public activeWallpaperId$: Observable<string> = this.activeWallpaperId.asObservable();
  private activeWallpaper: BehaviorSubject<Wallpaper | null> = new BehaviorSubject<Wallpaper | null>(null);
  public activeWallpaper$: Observable<Wallpaper | null> = this.activeWallpaper.asObservable();

  constructor(
    private readonly apiService: ApiService,
    private readonly appConfigService: AppConfigService
  ) {}

  getWallpapers(param: WallpaperQueryParam): Observable<ResultList<Wallpaper>> {
    return this.apiService
      .httpGet(ApiUrl.WALLPAPERS, {
        ...param,
        appId: this.appConfigService.appId
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

  getFutureWallpapers(param: WallpaperQueryParam): Observable<ResultList<Wallpaper>> {
    return this.apiService
      .httpGet(ApiUrl.WALLPAPER_FUTURE, {
        ...param,
        appId: this.appConfigService.appId
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
        appId: this.appConfigService.appId
      })
      .pipe(
        map((res) => {
          return (res?.data || []).map((item: HotWallpaper) => {
            return {
              ...item,
              title: item.titleCn || item.titleEn,
              copyright: item.copyrightCn || item.copyrightEn,
              isCn: !!item.copyrightCn,
              isEn: !!item.copyrightEn
            };
          });
        })
      );
  }

  getRandomWallpapers(size: number, simple?: boolean, resolution?: string): Observable<Wallpaper[]> {
    const payload: Record<string, any> = {
      size,
      simple: simple ? 1 : 0,
      appId: this.appConfigService.appId
    };
    if (resolution) {
      payload['resolution'] = resolution;
    }

    return this.apiService.httpGet(ApiUrl.WALLPAPER_RANDOM, payload).pipe(
      map((res) => {
        return (res?.data || []).map((item: Wallpaper) => {
          return {
            ...item,
            title: item.title || item.titleEn,
            copyright: item.copyright || item.copyrightEn,
            isCn: !!item.copyright,
            isEn: !!item.copyrightEn
          };
        });
      })
    );
  }

  getRelatedWallpapers(param: WallpaperRelatedParam): Observable<WallpaperSearchItem[]> {
    return this.apiService
      .httpGet(ApiUrl.WALLPAPER_RELATED, { ...param, appId: this.appConfigService.appId })
      .pipe(map((res) => res?.data || []));
  }

  getWallpaperArchives(showCount = false, limit = 10): Observable<ArchiveData[]> {
    return this.apiService
      .httpGet(ApiUrl.WALLPAPER_ARCHIVES, {
        showCount: showCount ? 1 : 0,
        limit,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data?.archives || []));
  }

  getWallpaperById(id: string, jigsaw = false): Observable<Wallpaper> {
    return this.apiService
      .httpGet(ApiUrl.WALLPAPER, {
        id,
        jigsaw: jigsaw ? 1 : 0,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data));
  }

  getWallpapersOfPrevAndNext(id: string): Observable<PrevAndNextWallpapers> {
    return this.apiService
      .httpGet(ApiUrl.WALLPAPER_PREV_AND_NEXT, {
        id,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }

  updateActiveWallpaperId(id: string) {
    this.activeWallpaperId.next(id);
  }

  updateActiveWallpaper(wallpaper: Wallpaper) {
    this.activeWallpaper.next(wallpaper);
  }

  getWallpaperDownloadUrl(id: string, uhd: 0 | 1): Observable<string> {
    return this.apiService
      .httpGet(
        ApiUrl.WALLPAPER_DOWNLOAD_URL,
        {
          id,
          uhd
        },
        true
      )
      .pipe(map((res) => res?.data || ''));
  }

  transformWallpaper(wallpaper: Wallpaper): Wallpaper {
    return {
      ...wallpaper,
      title: wallpaper.title || wallpaper.titleEn,
      titleEn: wallpaper.titleEn || wallpaper.title,
      copyright: wallpaper.copyright || wallpaper.copyrightEn,
      copyrightEn: wallpaper.copyrightEn || wallpaper.copyright,
      location: wallpaper.location || wallpaper.locationEn || '未知',
      locationEn: wallpaper.locationEn || wallpaper.location || 'Unknown',
      storyTitle: wallpaper.storyTitle || wallpaper.storyTitleEn,
      storyTitleEn: wallpaper.storyTitleEn || wallpaper.storyTitle,
      story: wallpaper.story || wallpaper.storyEn,
      storyEn: wallpaper.storyEn || wallpaper.story,
      fact: wallpaper.fact || wallpaper.factEn,
      factEn: wallpaper.factEn || wallpaper.fact,
      isCn: !!wallpaper.copyright,
      isEn: !!wallpaper.copyrightEn
    };
  }

  getWallpaperLink(id: string, isEn: boolean) {
    return `${this.appConfigService.apps['wallpaper'].url}/detail/${id}${isEn ? '?lang=en' : ''}`;
  }
}
