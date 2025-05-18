import { NgFor } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DestroyService, UserAgentService } from 'common/core';
import { WallpaperLang } from 'common/enums';
import { WallpaperSearchItem } from 'common/interfaces';
import { WallpaperService } from 'common/services';
import { skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-wallpaper-related',
  imports: [NgFor, RouterLink],
  providers: [DestroyService],
  templateUrl: './wallpaper-related.component.html'
})
export class WallpaperRelatedComponent implements OnInit {
  @Input() lang: WallpaperLang = WallpaperLang.CN;
  @Input() jigsaw = false;

  isMobile = false;
  relatedWallpapers: WallpaperSearchItem[] = [];

  private wallpaperId = '';
  private isChanged = false;
  private isLoaded = false;

  constructor(
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly wallpaperService: WallpaperService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    this.wallpaperService.activeWallpaperId$
      .pipe(
        skipWhile((wallpaperId) => !wallpaperId),
        takeUntil(this.destroy$)
      )
      .subscribe((wallpaperId) => {
        this.isChanged = this.wallpaperId !== wallpaperId;
        this.wallpaperId = wallpaperId;
        if (!this.isLoaded || this.isChanged) {
          this.getRelatedWallpapers();
          this.isLoaded = true;
        }
      });
  }

  getLangParams(wallpaper: WallpaperSearchItem) {
    if (this.lang === WallpaperLang.CN) {
      return !wallpaper.isCn ? { lang: WallpaperLang.EN } : {};
    }
    return !wallpaper.isEn ? {} : { lang: WallpaperLang.EN };
  }

  getWallpaperCopyright(wallpaper: WallpaperSearchItem) {
    return this.lang === WallpaperLang.EN ? wallpaper.wallpaperCopyrightEn : wallpaper.wallpaperCopyrightCn;
  }

  private getRelatedWallpapers(): void {
    this.wallpaperService
      .getRelatedWallpapers({
        wid: this.wallpaperId,
        page: 1,
        size: 4
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.relatedWallpapers = (res || []).map((item) => {
          return {
            ...item,
            wallpaperTitleCn: item.wallpaperTitleCn || item.wallpaperTitleEn,
            wallpaperTitleEn: item.wallpaperTitleEn || item.wallpaperTitleCn,
            wallpaperCopyrightCn: item.wallpaperCopyrightCn || item.wallpaperCopyrightEn,
            wallpaperCopyrightEn: item.wallpaperCopyrightEn || item.wallpaperCopyrightCn,
            isCn: !!item.wallpaperCopyrightCn,
            isEn: !!item.wallpaperCopyrightEn
          };
        });
      });
  }
}
