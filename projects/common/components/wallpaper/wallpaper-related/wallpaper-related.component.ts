import { Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DestroyService, UserAgentService } from 'common/core';
import { WallpaperLang } from 'common/enums';
import { WallpaperSearchItem } from 'common/interfaces';
import { WallpaperService } from 'common/services';
import { skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-wallpaper-related',
  imports: [RouterLink],
  providers: [DestroyService],
  templateUrl: './wallpaper-related.component.html'
})
export class WallpaperRelatedComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly wallpaperService = inject(WallpaperService);

  readonly lang = input(WallpaperLang.CN);
  readonly jigsaw = input(false);

  readonly isMobile = this.uaService.isMobile;
  readonly relatedWallpapers = signal<WallpaperSearchItem[]>([]);

  private readonly wallpaperId = signal('');
  private readonly isChanged = signal(false);
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
          this.getRelatedWallpapers();
          this.isLoaded.set(true);
        }
      });
  }

  getLangParams(wallpaper: WallpaperSearchItem) {
    if (this.lang() === WallpaperLang.CN) {
      return !wallpaper.isCn ? { lang: WallpaperLang.EN } : {};
    }
    return !wallpaper.isEn ? {} : { lang: WallpaperLang.EN };
  }

  getWallpaperCopyright(wallpaper: WallpaperSearchItem) {
    return this.lang() === WallpaperLang.EN ? wallpaper.copyrightEn : wallpaper.copyrightCn;
  }

  private getRelatedWallpapers(): void {
    this.wallpaperService
      .getRelatedWallpapers({
        id: this.wallpaperId(),
        page: 1,
        size: 4
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.relatedWallpapers.set(
          (res || []).map((item) => {
            return {
              ...item,
              titleCn: item.titleCn || item.titleEn,
              titleEn: item.titleEn || item.titleCn,
              copyrightCn: item.copyrightCn || item.copyrightEn,
              copyrightEn: item.copyrightEn || item.copyrightCn,
              isCn: !!item.copyrightCn,
              isEn: !!item.copyrightEn
            };
          })
        );
      });
  }
}
