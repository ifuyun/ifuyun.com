import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DestroyService, UserAgentService } from 'common/core';
import { WallpaperLang } from 'common/enums';
import { Wallpaper } from 'common/interfaces';
import { WallpaperService } from 'common/services';
import { skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-wallpaper-prev-next',
  imports: [RouterLink],
  providers: [DestroyService],
  templateUrl: './wallpaper-prev-next.component.html'
})
export class WallpaperPrevNextComponent implements OnInit {
  @Input() lang: WallpaperLang = WallpaperLang.CN;
  @Input() jigsaw = false;

  isMobile = false;
  isChanged = false;
  prevWallpaper?: Wallpaper;
  nextWallpaper?: Wallpaper;

  private wallpaperId = '';
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
          this.getWallpapersOfPrevAndNext();
          this.isLoaded = true;
        }
      });
  }

  getLangParams(wallpaper: Wallpaper) {
    if (this.lang === WallpaperLang.CN) {
      return !wallpaper.isCn ? { lang: WallpaperLang.EN } : {};
    }
    return !wallpaper.isEn ? {} : { lang: WallpaperLang.EN };
  }

  private getWallpapersOfPrevAndNext(): void {
    this.wallpaperService
      .getWallpapersOfPrevAndNext(this.wallpaperId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.prevWallpaper) {
          this.prevWallpaper = {
            ...res.prevWallpaper,
            wallpaperTitle: res.prevWallpaper.wallpaperTitle || res.prevWallpaper.wallpaperTitleEn,
            wallpaperCopyright: res.prevWallpaper.wallpaperCopyright || res.prevWallpaper.wallpaperCopyrightEn,
            wallpaperTitleEn: res.prevWallpaper.wallpaperTitleEn || res.prevWallpaper.wallpaperTitle,
            wallpaperCopyrightEn: res.prevWallpaper.wallpaperCopyrightEn || res.prevWallpaper.wallpaperCopyright,
            isCn: !!res.prevWallpaper.wallpaperCopyright,
            isEn: !!res.prevWallpaper.wallpaperCopyrightEn
          };
        } else {
          this.prevWallpaper = undefined;
        }
        if (res.nextWallpaper) {
          this.nextWallpaper = {
            ...res.nextWallpaper,
            wallpaperTitle: res.nextWallpaper.wallpaperTitle || res.nextWallpaper.wallpaperTitleEn,
            wallpaperCopyright: res.nextWallpaper.wallpaperCopyright || res.nextWallpaper.wallpaperCopyrightEn,
            wallpaperTitleEn: res.nextWallpaper.wallpaperTitleEn || res.nextWallpaper.wallpaperTitle,
            wallpaperCopyrightEn: res.nextWallpaper.wallpaperCopyrightEn || res.nextWallpaper.wallpaperCopyright,
            isCn: !!res.nextWallpaper.wallpaperCopyright,
            isEn: !!res.nextWallpaper.wallpaperCopyrightEn
          };
        } else {
          this.nextWallpaper = undefined;
        }
      });
  }
}
