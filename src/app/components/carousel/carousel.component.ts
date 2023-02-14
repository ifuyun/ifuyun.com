import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { LinkTarget } from '../../config/common.enum';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { CarouselOptions, CarouselVo, OptionEntity } from '../../interfaces/option.interface';
import { BING_DOMAIN } from '../../pages/wallpaper/wallpaper.constant';
import { WallpaperLang } from '../../pages/wallpaper/wallpaper.interface';
import { WallpaperService } from '../../pages/wallpaper/wallpaper.service';
import { OptionService } from '../../services/option.service';

@Component({
  selector: 'i-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.less'],
  providers: [DestroyService]
})
export class CarouselComponent implements OnInit, OnDestroy, AfterViewInit {
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
    private optionService: OptionService,
    private wallpaperService: WallpaperService
  ) {}

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
          this.carouselOptions = JSON.parse(options['carousel_options']);
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
      .getRandomWallpapers(this.carouselOptions.size || 4, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const resolution = this.carouselOptions.resolution || '1280x720';
        this.carousels = res.map((wallpaper, index) => {
          const url = `${BING_DOMAIN}${wallpaper.urlBase}_${resolution}.${wallpaper.imageFormat}`;
          return {
            id: wallpaper.wallpaperId,
            title: wallpaper.title || wallpaper.titleEn,
            caption: wallpaper.copyright || wallpaper.copyrightEn,
            url,
            fullUrl: url,
            link: `/wallpaper/${wallpaper.wallpaperId}`,
            target: LinkTarget.BLANK,
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
        orderBy: this.carouselOptions.orderBy === 'oldest' ? [['date', 'asc']] : [['date', 'desc']]
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const resolution = this.carouselOptions.resolution || '1280x720';
        this.carousels = (res.list || []).map((wallpaper, index) => {
          const url = `${BING_DOMAIN}${wallpaper.urlBase}_${resolution}.${wallpaper.imageFormat}`;
          return {
            id: wallpaper.wallpaperId,
            title: wallpaper.title || wallpaper.titleEn,
            caption: wallpaper.copyright || wallpaper.copyrightEn,
            url,
            fullUrl: url,
            link: `/wallpaper/${wallpaper.wallpaperId}`,
            target: LinkTarget.BLANK,
            order: index + 1
          };
        });
      });
  }
}
