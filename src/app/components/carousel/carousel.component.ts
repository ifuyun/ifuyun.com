import { NgClass, NgFor, NgIf, NgStyle } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { BLANK_IMAGE } from '../../config/common.constant';
import { LinkTarget } from '../../config/common.enum';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { UserAgentService } from '../../core/user-agent.service';
import { Action, ActionObjectType } from '../../interfaces/log.enum';
import { CarouselOptions, CarouselVo, OptionEntity } from '../../interfaces/option.interface';
import { BING_DOMAIN } from '../../pages/wallpaper/wallpaper.constant';
import { WallpaperLang } from '../../pages/wallpaper/wallpaper.interface';
import { WallpaperService } from '../../pages/wallpaper/wallpaper.service';
import { LogService } from '../../services/log.service';
import { OptionService } from '../../services/option.service';

@Component({
  selector: 'i-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.less'],
  standalone: true,
  imports: [NgClass, NgFor, NgIf, NgStyle],
  providers: [DestroyService]
})
export class CarouselComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly blankImage = BLANK_IMAGE;

  isMobile = false;
  options: OptionEntity = {};
  carousels: CarouselVo[] = [];
  activeIndex = 0;
  isRevert = false;
  timer!: any;

  private carouselOptions!: CarouselOptions;
  private staticResourceHost = '';

  constructor(
    private destroy$: DestroyService,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private optionService: OptionService,
    private wallpaperService: WallpaperService,
    private logService: LogService
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        this.options = options;
        this.staticResourceHost = options['static_resource_host'];
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
      this.timer = setInterval(() => {
        this.isRevert = false;
        this.activeIndex = this.activeIndex + 1 >= this.carousels.length ? 0 : this.activeIndex + 1;
      }, 3000);
    }
  }

  logClick(carousel: CarouselVo) {
    this.logService
      .logAction({
        action: Action.CLICK_CAROUSEL,
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
          item.fullUrl = /^https?:\/\//i.test(item.url) ? item.url : this.staticResourceHost + item.url;
        });
      });
  }

  private fetchRandomWallpapers() {
    this.wallpaperService
      .getRandomWallpapers(this.carouselOptions.size || 4, 1, this.carouselOptions.resolution || '1280x720')
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.carousels = res.map((wallpaper, index) => {
          const url = `${BING_DOMAIN}${wallpaper.wallpaperUrl}`;
          return {
            id: wallpaper.wallpaperId,
            title: wallpaper.wallpaperTitle || wallpaper.wallpaperTitleEn,
            caption: wallpaper.wallpaperCopyright || wallpaper.wallpaperCopyrightEn,
            url,
            fullUrl: url,
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
        orderBy: this.carouselOptions.orderBy === 'oldest' ? [['wallpaperDate', 'asc']] : [['wallpaperDate', 'desc']]
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.carousels = (res.list || []).map((wallpaper, index) => {
          const url = `${BING_DOMAIN}${wallpaper.wallpaperUrl}`;
          return {
            id: wallpaper.wallpaperId,
            title: wallpaper.wallpaperTitle || wallpaper.wallpaperTitleEn,
            caption: wallpaper.wallpaperCopyright || wallpaper.wallpaperCopyrightEn,
            url,
            fullUrl: url,
            link: this.getWallpaperLink(wallpaper.wallpaperId, !wallpaper.wallpaperTitle),
            target: LinkTarget.SELF,
            order: index + 1
          };
        });
      });
  }

  private getWallpaperLink(wallpaperId: string, isEn: boolean) {
    const url = `${this.options['site_url']}/wallpaper/${wallpaperId}`;
    const langParam = isEn ? '?lang=en' : '';
    return url + langParam;
  }
}
