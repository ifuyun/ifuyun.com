import { Component, inject, input, OnInit, signal } from '@angular/core';
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
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly wallpaperService = inject(WallpaperService);

  readonly lang = input(WallpaperLang.CN);
  readonly jigsaw = input(false);

  readonly isMobile = this.uaService.isMobile;
  readonly isChanged = signal(false);
  readonly prevWallpaper = signal<Wallpaper | null>(null);
  readonly nextWallpaper = signal<Wallpaper | null>(null);

  private readonly wallpaperId = signal('');
  private readonly isLoaded = signal(false);

  ngOnInit(): void {
    this.wallpaperService.activeWallpaperId$
      .pipe(
        skipWhile((wallpaperId) => !wallpaperId),
        takeUntil(this.destroy$)
      )
      .subscribe((wallpaperId) => {
        this.isChanged.set(this.wallpaperId() !== wallpaperId);
        this.wallpaperId.set(wallpaperId);

        if (!this.isLoaded() || this.isChanged()) {
          this.getWallpapersOfPrevAndNext();
          this.isLoaded.set(true);
        }
      });
  }

  getLangParams(wallpaper: Wallpaper) {
    if (this.lang() === WallpaperLang.CN) {
      return !wallpaper.isCn ? { lang: WallpaperLang.EN } : {};
    }
    return !wallpaper.isEn ? {} : { lang: WallpaperLang.EN };
  }

  private getWallpapersOfPrevAndNext(): void {
    this.wallpaperService
      .getWallpapersOfPrevAndNext(this.wallpaperId())
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.prevWallpaper) {
          this.prevWallpaper.set({
            ...res.prevWallpaper,
            title: res.prevWallpaper.title || res.prevWallpaper.titleEn,
            copyright: res.prevWallpaper.copyright || res.prevWallpaper.copyrightEn,
            titleEn: res.prevWallpaper.titleEn || res.prevWallpaper.title,
            copyrightEn: res.prevWallpaper.copyrightEn || res.prevWallpaper.copyright,
            isCn: !!res.prevWallpaper.copyright,
            isEn: !!res.prevWallpaper.copyrightEn
          });
        } else {
          this.prevWallpaper.set(null);
        }
        if (res.nextWallpaper) {
          this.nextWallpaper.set({
            ...res.nextWallpaper,
            title: res.nextWallpaper.title || res.nextWallpaper.titleEn,
            copyright: res.nextWallpaper.copyright || res.nextWallpaper.copyrightEn,
            titleEn: res.nextWallpaper.titleEn || res.nextWallpaper.title,
            copyrightEn: res.nextWallpaper.copyrightEn || res.nextWallpaper.copyright,
            isCn: !!res.nextWallpaper.copyright,
            isEn: !!res.nextWallpaper.copyrightEn
          });
        } else {
          this.nextWallpaper.set(null);
        }
      });
  }
}
