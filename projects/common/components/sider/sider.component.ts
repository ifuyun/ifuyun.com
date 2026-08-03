import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  model,
  OnDestroy,
  OnInit,
  signal,
  viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Params } from '@angular/router';
import {
  AppConfigService,
  ArchiveData,
  DestroyService,
  OptionEntity,
  PageIndexInfo,
  PlatformService
} from 'common/core';
import { WallpaperLang } from 'common/enums';
import { IconCalendarDateComponent } from 'common/icons';
import { GameEntity, HotWallpaper, PostEntity, Wallpaper } from 'common/interfaces';
import { CommonService, OptionService, PostService, WallpaperService } from 'common/services';
import { isEmpty } from 'lodash';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { skipWhile, takeUntil } from 'rxjs';
import { AdsenseComponent } from '../adsense/adsense.component';
import { GameService } from '../game/game.service';
import { JigsawService } from '../jigsaw/jigsaw.service';
import { SmartLinkComponent } from '../smart-link/smart-link.component';

@Component({
  selector: 'lib-sider',
  imports: [
    FormsModule,
    NzIconModule,
    NzRadioModule,
    NzEmptyModule,
    AdsenseComponent,
    SmartLinkComponent,
    IconCalendarDateComponent
  ],
  providers: [DestroyService],
  templateUrl: './sider.component.html',
  styleUrl: './sider.component.less'
})
export class SiderComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = inject(DestroyService);
  private readonly platform = inject(PlatformService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly commonService = inject(CommonService);
  private readonly optionService = inject(OptionService);
  private readonly postService = inject(PostService);
  private readonly wallpaperService = inject(WallpaperService);
  private readonly gameService = inject(GameService);
  private readonly jigsawService = inject(JigsawService);

  readonly siderEle = viewChild<ElementRef<HTMLElement>>('siderEle');

  readonly adsPlaceholder = true;
  readonly domains = this.appConfigService.apps;
  readonly indexInfo = signal<PageIndexInfo | null>(null);
  readonly hotPosts = signal<PostEntity[]>([]);
  readonly postArchives = signal<ArchiveData[]>([]);
  readonly hotWallpapers = signal<HotWallpaper[]>([]);
  readonly wallpaperArchives = signal<ArchiveData[]>([]);
  readonly hotGames = signal<GameEntity[]>([]);
  readonly recentGames = signal<GameEntity[]>([]);
  readonly hotJigsaws = signal<Wallpaper[]>([]);
  readonly hotJigsawType = model('m');
  readonly adsVisible = computed(() => {
    return (
      (!this.appConfigService.isDev && ['1', '0'].includes(this.options()['ads_flag'])) ||
      (this.appConfigService.isDev && ['2', '0'].includes(this.options()['ads_flag']))
    );
  });

  private readonly options = signal<OptionEntity>({});
  private readonly pageIndex = signal('');

  ngOnInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        this.options.set(options);
      });
    this.commonService.pageIndex$
      .pipe(
        skipWhile((pageIndex) => !pageIndex),
        takeUntil(this.destroy$)
      )
      .subscribe((pageIndex) => {
        if (this.pageIndex() !== pageIndex) {
          const indexInfo = this.commonService.getPageIndexInfo(pageIndex);

          this.pageIndex.set(pageIndex);
          this.indexInfo.set(indexInfo);

          const { isPost, isWallpaper, isGame, isTool, isPage, isSearch } = indexInfo;

          if (isPost || isPage || isTool || isSearch) {
            this.getHotPosts();
          } else {
            this.hotPosts.set([]);
          }
          if (isWallpaper || isPage || isTool || isSearch) {
            this.getHotWallpapers();
          } else {
            this.hotWallpapers.set([]);
          }
          if (isGame || isPage || isTool || isSearch) {
            this.getHotGames();
          } else {
            this.hotGames.set([]);
          }
          if (isPost) {
            this.getPostArchives();
          } else {
            this.postArchives.set([]);
          }
          if (isWallpaper) {
            this.getWallpaperArchives();
            this.getHotJigsaws();
          } else {
            this.wallpaperArchives.set([]);
            this.hotJigsaws.set([]);
          }
          if (isGame) {
            this.getRecentGames();
          } else {
            this.recentGames.set([]);
          }
        }
      });
  }

  ngAfterViewInit(): void {
    if (this.platform.isBrowser) {
      window.addEventListener('scroll', this.scrollHandler);
      window.addEventListener('resize', this.scrollHandler);
    }
  }

  ngOnDestroy(): void {
    if (this.platform.isBrowser) {
      window.removeEventListener('scroll', this.scrollHandler);
      window.removeEventListener('resize', this.scrollHandler);
    }
  }

  getWallpaperLangParams(isCn: boolean): Params {
    return isCn ? {} : { lang: WallpaperLang.EN };
  }

  getHotJigsaws() {
    this.jigsawService
      .getHotJigsaws(this.hotJigsawType())
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.hotJigsaws.set(res);
      });
  }

  private getHotPosts() {
    this.postService
      .getHotPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.hotPosts.set(res);
      });
  }

  private getPostArchives() {
    this.postService
      .getPostArchives(true, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.postArchives.set(res);
      });
  }

  private getHotWallpapers() {
    this.wallpaperService
      .getHotWallpapers(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.hotWallpapers.set(res);
      });
  }

  private getWallpaperArchives() {
    this.wallpaperService
      .getWallpaperArchives(true, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.wallpaperArchives.set(res);
      });
  }

  private getHotGames() {
    this.gameService
      .getHotGames()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.hotGames.set(res);
      });
  }

  private getRecentGames() {
    this.gameService
      .getRecentGames(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.recentGames.set(res);
      });
  }

  private scrollHandler = () => {
    const docEle = document.documentElement;
    const siderEle = this.siderEle();

    if (siderEle && docEle.scrollTop > 0) {
      if (docEle.scrollTop > siderEle.nativeElement.scrollHeight - docEle.clientHeight) {
        siderEle.nativeElement.style.position = 'sticky';
        if (siderEle.nativeElement.scrollHeight < docEle.clientHeight) {
          siderEle.nativeElement.style.top = '0';
        } else {
          siderEle.nativeElement.style.top = docEle.clientHeight - siderEle.nativeElement.scrollHeight - 16 + 'px';
        }
      } else {
        siderEle.nativeElement.style.position = 'relative';
        siderEle.nativeElement.style.top = '';
      }
    }
  };
}
