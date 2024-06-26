import { NgClass, NgFor, NgIf, NgStyle } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { APP_ID } from '../../config/common.constant';
import { LinkTarget } from '../../config/common.enum';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { UserAgentService } from '../../core/user-agent.service';
import { ActionObjectType, ActionType } from '../../interfaces/log.enum';
import { CarouselOptions, CarouselVo } from '../../interfaces/option.interface';
import { TenantAppModel } from '../../interfaces/tenant-app.interface';
import { WallpaperLang } from '../../pages/wallpaper/wallpaper.interface';
import { WallpaperService } from '../../pages/wallpaper/wallpaper.service';
import { LogService } from '../../services/log.service';
import { OptionService } from '../../services/option.service';
import { TenantAppService } from '../../services/tenant-app.service';

@Component({
  selector: 'i-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.less'],
  standalone: true,
  imports: [NgClass, NgFor, NgIf, NgStyle],
  providers: [DestroyService]
})
export class CarouselComponent implements OnInit, OnDestroy, AfterViewInit {
  isMobile = false;
  carousels: CarouselVo[] = [];
  activeIndex = 0;
  isRevert = false;
  timer!: number;

  private appInfo!: TenantAppModel;
  private carouselOptions!: CarouselOptions;

  constructor(
    private destroy$: DestroyService,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private tenantAppService: TenantAppService,
    private optionService: OptionService,
    private wallpaperService: WallpaperService,
    private logService: LogService
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo = appInfo;

        try {
          this.carouselOptions = JSON.parse(options['carousel_config']);
        } catch (e) {
          this.carouselOptions = { type: 'album' };
        }

        if (this.carouselOptions.type === 'album') {
          this.fetchCarousels();
        } else {
          if (this.carouselOptions.orderBy === 'random') {
            this.fetchRandomWallpapers();
          } else {
            this.fetchWallpapers();
          }
        }
      });
  }

  ngOnDestroy() {
    this.stop();
  }

  ngAfterViewInit() {
    this.start();
  }

  switchBanner(index: number) {
    this.isRevert = index < this.activeIndex;
    this.activeIndex = index;
  }

  stop() {
    this.timer && clearInterval(this.timer);
  }

  start() {
    if (this.platform.isBrowser) {
      this.timer = window.setInterval(() => {
        this.isRevert = false;
        this.activeIndex = this.activeIndex + 1 >= this.carousels.length ? 0 : this.activeIndex + 1;
      }, 3000);
    }
  }

  logClick(carousel: CarouselVo) {
    this.logService
      .logAction({
        action: ActionType.CLICK_CAROUSEL,
        objectType: ActionObjectType.CAROUSEL,
        carouselTitle: carousel.title,
        carouselURL: carousel.link
      })
      .subscribe();
  }

  private fetchCarousels() {
    this.optionService
      .getCarousels()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.carousels = res;
        this.carousels.forEach((item) => {
          item.fullUrl = item.url;
        });
      });
  }

  private fetchRandomWallpapers() {
    this.wallpaperService
      .getRandomWallpapers({
        size: this.carouselOptions.size || 4,
        resolution: this.carouselOptions.resolution || '1280x720'
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.carousels = res.map((wallpaper, index) => {
          return {
            id: wallpaper.wallpaperId,
            title: wallpaper.wallpaperTitle || wallpaper.wallpaperTitleEn,
            caption: wallpaper.wallpaperCopyright || wallpaper.wallpaperCopyrightEn,
            url: wallpaper.wallpaperUrl,
            fullUrl: wallpaper.wallpaperUrl,
            link: this.getWallpaperLink(wallpaper.wallpaperId, !wallpaper.wallpaperTitle),
            target: LinkTarget.SELF,
            order: index + 1
          };
        });
      });
  }

  private fetchWallpapers() {
    this.wallpaperService
      .getWallpapers({
        page: 1,
        pageSize: this.carouselOptions.size || 4,
        lang: [WallpaperLang.CN, WallpaperLang.EN],
        resolution: this.carouselOptions.resolution || '1280x720',
        orderBy: this.carouselOptions.orderBy === 'oldest' ? [['wallpaperDate', 'asc']] : [['wallpaperDate', 'desc']],
        appId: APP_ID
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.carousels = (res.list || []).map((wallpaper, index) => {
          return {
            id: wallpaper.wallpaperId,
            title: wallpaper.wallpaperTitle || wallpaper.wallpaperTitleEn,
            caption: wallpaper.wallpaperCopyright || wallpaper.wallpaperCopyrightEn,
            url: wallpaper.wallpaperUrl,
            fullUrl: wallpaper.wallpaperUrl,
            link: this.getWallpaperLink(wallpaper.wallpaperId, !wallpaper.wallpaperTitle),
            target: LinkTarget.SELF,
            order: index + 1
          };
        });
      });
  }

  private getWallpaperLink(wallpaperId: string, isEn: boolean) {
    const url = `${this.appInfo.appUrl}/wallpaper/${wallpaperId}`;
    const langParam = isEn ? '?lang=en' : '';

    return url + langParam;
  }
}
