import { NgFor } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { skipWhile, takeUntil } from 'rxjs';
import { WallpaperLang } from '../../enums/wallpaper';
import { WallpaperSearchItem } from '../../interfaces/wallpaper';
import { DestroyService } from '../../services/destroy.service';
import { UserAgentService } from '../../services/user-agent.service';
import { WallpaperService } from '../../services/wallpaper.service';

@Component({
  selector: 'app-wallpaper-related',
  imports: [NgFor, RouterLink],
  providers: [DestroyService],
  templateUrl: './wallpaper-related.component.html',
  styleUrl: './wallpaper-related.component.less'
})
export class WallpaperRelatedComponent implements OnInit {
  @Input() lang: WallpaperLang = WallpaperLang.CN;

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
          const titleCn = item.wallpaperTitleCn || item.wallpaperTitleEn;
          const titleEn = item.wallpaperTitleEn || item.wallpaperTitleCn;
          const copyrightCn = item.wallpaperCopyrightCn || item.wallpaperCopyrightEn;
          const copyrightEn = item.wallpaperCopyrightEn || item.wallpaperCopyrightCn;

          return {
            ...item,
            wallpaperTitle: this.lang === WallpaperLang.EN ? titleEn : titleCn,
            wallpaperCopyright: this.lang === WallpaperLang.EN ? copyrightEn : copyrightCn,
            isCn: !!item.wallpaperCopyrightCn,
            isEn: !!item.wallpaperCopyrightEn
          };
        });
      });
  }
}
