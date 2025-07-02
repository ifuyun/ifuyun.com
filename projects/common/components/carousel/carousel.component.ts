import { NgFor, NgIf, NgStyle } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DestroyService, PlatformService, UserAgentService } from 'common/core';
import { ActionObjectType, ActionType, LinkTarget, WallpaperLang } from 'common/enums';
import { CarouselOptions, CarouselVo, HotWallpaper, Wallpaper } from 'common/interfaces';
import { RangePipe } from 'common/pipes';
import { LogService, OptionService, WallpaperService } from 'common/services';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-carousel',
  imports: [NgFor, NgIf, NgStyle, RangePipe],
  providers: [DestroyService],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.less'
})
export class CarouselComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('carouselBody') carouselBody!: ElementRef;

  isMobile = false;
  carousels: CarouselVo[] = [];
  activeIndex = 0;
  isRevert = false;

  private carouselOptions!: CarouselOptions;
  private interval = 3000;
  private isPaused = false;
  private lastTimestamp = 0;
  private rafId: number | null = null;

  constructor(
    private readonly destroy$: DestroyService,
    private readonly platform: PlatformService,
    private readonly userAgentService: UserAgentService,
    private readonly optionService: OptionService,
    private readonly wallpaperService: WallpaperService,
    private readonly logService: LogService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        try {
          this.carouselOptions = JSON.parse(options['carousel_config']);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          this.carouselOptions = { type: 'wallpaper', orderBy: 'newest' };
        }

        if (this.carouselOptions.type === 'album') {
          this.getCarousels();
        } else {
          if (this.carouselOptions.orderBy === 'random') {
            this.getRandomWallpapers();
          } else if (this.carouselOptions.orderBy === 'hottest') {
            this.getHotWallpapers();
          } else {
            this.getWallpapers();
          }
        }
      });
  }

  ngAfterViewInit(): void {
    if (this.platform.isBrowser) {
      this.start();
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  ngOnDestroy(): void {
    if (this.platform.isBrowser) {
      this.pause();
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  carouselMouseOver() {
    this.isPaused = true;
    this.pause();
  }

  carouselMouseOut() {
    this.isPaused = false;
    this.start();
  }

  switchCarousel(index: number) {
    if (index === this.activeIndex) {
      return;
    }
    this.isRevert = index < this.activeIndex;
    this.activeIndex = index;
    this.update();
  }

  logClick(carousel: CarouselVo) {
    this.logService
      .logAction({
        action: ActionType.CLICK_CAROUSEL,
        objectType: ActionObjectType.CAROUSEL,
        carouselTitle: carousel.title,
        carouselURL: carousel.link
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private loop = (timestamp: number) => {
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
    }
    if (timestamp - this.lastTimestamp >= this.interval) {
      this.next();
      this.lastTimestamp = timestamp;
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  private start() {
    if (!this.rafId) {
      this.lastTimestamp = 0;
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  private pause() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);

      this.rafId = null;
    }
  }

  private next() {
    this.isRevert = false;
    this.activeIndex = (this.activeIndex + 1) % this.carousels.length;
    this.update();
  }

  private update(): void {
    this.carouselBody.nativeElement.style.transitionDuration = '';

    if (this.activeIndex === this.carousels.length - 1) {
      window.setTimeout(() => {
        this.activeIndex = 0;
        this.carouselBody.nativeElement.style.transitionDuration = '0s';
        this.carouselBody.nativeElement.style.transform = 'translateX(0%)';
      }, 300);
    }
  }

  private onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      this.pause();
    } else if (!this.isPaused) {
      this.start();
    }
  };

  private getCarousels() {
    this.optionService
      .getCarousels()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.carousels = (res || []).map((item) => ({
          ...item,
          fullUrl: item.url
        }));
        this.initCarousels();
      });
  }

  private getRandomWallpapers() {
    this.wallpaperService
      .getRandomWallpapers(this.carouselOptions.size || 4)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.carousels = this.transformToCarousels(res);
        this.initCarousels();
      });
  }

  private getHotWallpapers() {
    this.wallpaperService
      .getHotWallpapers(this.carouselOptions.size || 4)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.carousels = this.transformToCarousels(res);
        this.initCarousels();
      });
  }

  private getWallpapers() {
    this.wallpaperService
      .getWallpapers({
        page: 1,
        size: this.carouselOptions.size || 4,
        lang: [WallpaperLang.CN, WallpaperLang.EN],
        orderBy: this.carouselOptions.orderBy === 'oldest' ? [['wallpaperDate', 'asc']] : [['wallpaperDate', 'desc']]
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.carousels = this.transformToCarousels(res.list || []);
        this.initCarousels();
      });
  }

  private initCarousels() {
    if (this.carousels.length > 0) {
      this.carousels.push(this.carousels[0]);
    }
  }

  private transformToCarousels(wallpapers: Wallpaper[] | HotWallpaper[]): CarouselVo[] {
    return wallpapers.map((item, index) => {
      return {
        id: item.wallpaperId,
        title: item.wallpaperTitle || item.wallpaperTitleEn,
        caption: item.wallpaperCopyright || item.wallpaperCopyrightEn,
        url: item.wallpaperUrl,
        fullUrl: item.wallpaperUrl,
        link: this.wallpaperService.getWallpaperLink(item.wallpaperId, !item.isCn && item.isEn),
        target: LinkTarget.SELF,
        order: index + 1
      };
    });
  }
}
