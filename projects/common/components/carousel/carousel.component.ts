import { NgStyle } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild
} from '@angular/core';
import { DestroyService, PlatformService, UserAgentService } from 'common/core';
import { LinkTarget, LogActionType, LogTargetType, WallpaperLang } from 'common/enums';
import { Carousel, CarouselOptions, Wallpaper } from 'common/interfaces';
import { RangePipe } from 'common/pipes';
import { LogService, OptionService, WallpaperService } from 'common/services';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-carousel',
  imports: [NgStyle, RangePipe],
  providers: [DestroyService],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.less'
})
export class CarouselComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly platform = inject(PlatformService);
  private readonly uaService = inject(UserAgentService);
  private readonly optionService = inject(OptionService);
  private readonly wallpaperService = inject(WallpaperService);
  private readonly logService = inject(LogService);

  readonly carouselBody = viewChild.required<ElementRef<HTMLDivElement>>('carouselBody');

  readonly isMobile = this.uaService.isMobile;
  readonly carousels = signal<Carousel[]>([]);
  readonly activeIndex = signal(0);
  readonly isRevert = signal(false);

  private readonly carouselOptions = signal<CarouselOptions | null>(null);
  private readonly interval = 3000;
  private readonly isPaused = signal(false);
  private readonly lastTimestamp = signal(0);
  private readonly rafId = signal<number | null>(null);

  ngOnInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        try {
          this.carouselOptions.set(JSON.parse(options['carousel_config']));
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          this.carouselOptions.set({ type: 'wallpaper', orderBy: 'newest' });
        }

        const carouselOptions = this.carouselOptions();
        if (carouselOptions) {
          if (carouselOptions.type === 'album') {
            this.getCarousels();
          } else {
            if (carouselOptions.orderBy === 'random') {
              this.getRandomWallpapers();
            } else if (carouselOptions.orderBy === 'hottest') {
              this.getHotWallpapers();
            } else {
              this.getWallpapers();
            }
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
    this.isPaused.set(true);
    this.pause();
  }

  carouselMouseOut() {
    this.isPaused.set(false);
    this.start();
  }

  switchCarousel(index: number) {
    if (index === this.activeIndex()) {
      return;
    }
    this.isRevert.set(index < this.activeIndex());
    this.activeIndex.set(index);
    this.update();
  }

  logClick(carousel: Carousel) {
    this.logService
      .logAction({
        action: LogActionType.CLICK_CAROUSEL,
        targetType: LogTargetType.CAROUSEL,
        carouselTitle: carousel.title,
        carouselURL: carousel.link
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private loop = (timestamp: number) => {
    if (!this.lastTimestamp()) {
      this.lastTimestamp.set(timestamp);
    }
    if (timestamp - this.lastTimestamp() >= this.interval) {
      this.next();
      this.lastTimestamp.set(timestamp);
    }

    this.rafId.set(requestAnimationFrame(this.loop));
  };

  private start() {
    if (!this.rafId()) {
      this.lastTimestamp.set(0);
      this.rafId.set(requestAnimationFrame(this.loop));
    }
  }

  private pause() {
    if (this.rafId()) {
      cancelAnimationFrame(this.rafId()!);

      this.rafId.set(null);
    }
  }

  private next() {
    this.isRevert.set(false);
    this.activeIndex.set((this.activeIndex() + 1) % this.carousels().length);
    this.update();
  }

  private update(): void {
    this.carouselBody().nativeElement.style.transitionDuration = '';

    if (this.activeIndex() === this.carousels().length - 1) {
      window.setTimeout(() => {
        this.activeIndex.set(0);
        this.carouselBody().nativeElement.style.transitionDuration = '0s';
        this.carouselBody().nativeElement.style.transform = 'translateX(0%)';
      }, 300);
    }
  }

  private onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      this.pause();
    } else if (!this.isPaused()) {
      this.start();
    }
  };

  private getCarousels() {
    this.optionService
      .getCarousels()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.carousels.set(res || []);
        this.initCarousels();
      });
  }

  private getRandomWallpapers() {
    this.wallpaperService
      .getRandomWallpapers(this.carouselOptions()?.size || 4)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.carousels.set(this.transformToCarousels(res));
        this.initCarousels();
      });
  }

  private getHotWallpapers() {
    this.wallpaperService
      .getHotWallpapers(this.carouselOptions()?.size || 4)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.carousels.set(
          res.map((item, index) => {
            return {
              id: item.wallpaperId,
              title: item.titleCn || item.titleEn,
              caption: item.copyrightCn || item.copyrightEn,
              url: item.url,
              link: this.wallpaperService.getWallpaperLink(item.wallpaperId, !item.copyright && !!item.copyrightEn),
              target: LinkTarget.SELF,
              order: index + 1
            };
          })
        );
        this.initCarousels();
      });
  }

  private getWallpapers() {
    this.wallpaperService
      .getWallpapers({
        page: 1,
        size: this.carouselOptions()?.size || 4,
        lang: [WallpaperLang.CN, WallpaperLang.EN],
        orderBy: this.carouselOptions()?.orderBy === 'oldest' ? [['bingDate', 'asc']] : [['bingDate', 'desc']]
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.carousels.set(this.transformToCarousels(res.list || []));
        this.initCarousels();
      });
  }

  private initCarousels() {
    if (this.carousels().length > 0) {
      const firstCarousel = this.carousels()[0];
      const lastCarousel = this.carousels()[this.carousels().length - 1];

      if (this.carousels().length < 2 || firstCarousel.id !== lastCarousel.id) {
        this.carousels.update((data) => [...data, { ...this.carousels()[0] }]);
      }
    }
  }

  private transformToCarousels(wallpapers: Wallpaper[]): Carousel[] {
    return wallpapers.map((item, index) => {
      return {
        id: item.id,
        title: item.title || item.titleEn,
        caption: item.copyright || item.copyrightEn,
        url: item.url,
        link: this.wallpaperService.getWallpaperLink(item.id, !item.isCn && item.isEn),
        target: LinkTarget.SELF,
        order: index + 1
      };
    });
  }
}
