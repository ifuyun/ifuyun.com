import { NgFor, NgIf, NgStyle } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { LinkTarget } from '../../enums/link';
import { ActionObjectType, ActionType } from '../../enums/log';
import { WallpaperLang } from '../../enums/wallpaper';
import { CarouselOptions, CarouselVo } from '../../interfaces/option';
import { HotWallpaper, Wallpaper } from '../../interfaces/wallpaper';
import { RangePipe } from '../../pipes/range.pipe';
import { DestroyService } from '../../services/destroy.service';
import { LogService } from '../../services/log.service';
import { OptionService } from '../../services/option.service';
import { PlatformService } from '../../services/platform.service';
import { UserAgentService } from '../../services/user-agent.service';
import { WallpaperService } from '../../services/wallpaper.service';

@Component({
  selector: 'app-carousel',
  imports: [NgFor, NgIf, NgStyle, RangePipe],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.less'
})
export class CarouselComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('carouselBody') carouselBody!: ElementRef;

  isMobile = false;
  carousels: CarouselVo[] = [];
  activeIndex = 0;
  isRevert = false;
  timer!: number;

  private carouselOptions!: CarouselOptions;
  private interval = 3000;
  private isPaused = false;

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
          this.fetchCarousels();
        } else {
          if (this.carouselOptions.orderBy === 'random') {
            this.fetchRandomWallpapers();
          } else if (this.carouselOptions.orderBy === 'hottest') {
            this.fetchHotWallpapers();
          } else {
            this.fetchWallpapers();
          }
        }
      });
  }

  ngAfterViewInit(): void {
    this.start();
    if (this.platform.isBrowser) {
      document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this));
    }
  }

  ngOnDestroy(): void {
    this.pause();
    if (this.platform.isBrowser) {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  start() {
    if (this.platform.isBrowser) {
      this.timer = window.setTimeout(() => {
        this.show();
      }, this.interval);
    }
  }

  show() {
    if (!this.isPaused) {
      this.isRevert = false;
      this.activeIndex = (this.activeIndex + 1) % this.carousels.length;
      this.update();

      requestAnimationFrame(this.start.bind(this));
    }
  }

  update(): void {
    this.carouselBody.nativeElement.style.transitionDuration = '';

    if (this.activeIndex === this.carousels.length - 1) {
      window.setTimeout(() => {
        this.activeIndex = 0;
        this.carouselBody.nativeElement.style.transitionDuration = '0s';
        this.carouselBody.nativeElement.style.transform = 'translateX(0%)';
      }, 300);
    }
  }

  pause() {
    if (this.platform.isBrowser) {
      this.isPaused = true;
      window.clearTimeout(this.timer);
    }
  }

  resume() {
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

  private onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      this.resume();
    } else {
      this.pause();
    }
  }

  private fetchCarousels() {
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

  private fetchRandomWallpapers() {
    this.wallpaperService
      .getRandomWallpapers(this.carouselOptions.size || 4)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.carousels = this.transformToCarousels(res);
        this.initCarousels();
      });
  }

  private fetchHotWallpapers() {
    this.wallpaperService
      .getHotWallpapers(this.carouselOptions.size || 4)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.carousels = this.transformToCarousels(res);
        this.initCarousels();
      });
  }

  private fetchWallpapers() {
    this.wallpaperService
      .getWallpapers({
        page: 1,
        pageSize: this.carouselOptions.size || 4,
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
