import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Params, RouterLink } from '@angular/router';
import {
  AppConfigService,
  AppDomainConfig,
  ArchiveData,
  DestroyService,
  OptionEntity,
  PageIndexInfo,
  PlatformService
} from 'common/core';
import { WallpaperLang } from 'common/enums';
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
  imports: [RouterLink, FormsModule, NzIconModule, NzRadioModule, NzEmptyModule, AdsenseComponent, SmartLinkComponent],
  providers: [DestroyService],
  templateUrl: './sider.component.html',
  styleUrl: './sider.component.less'
})
export class SiderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('siderEle') siderEle!: ElementRef;

  readonly adsPlaceholder = true;

  domains!: AppDomainConfig;
  indexInfo!: PageIndexInfo;
  hotPosts: PostEntity[] = [];
  randomPosts: PostEntity[] = [];
  postArchives: ArchiveData[] = [];
  hotWallpapers: HotWallpaper[] = [];
  randomWallpapers: Wallpaper[] = [];
  wallpaperArchives: ArchiveData[] = [];
  hotGames: GameEntity[] = [];
  randomGames: GameEntity[] = [];
  recentGames: GameEntity[] = [];
  hotJigsaws: Wallpaper[] = [];
  hotJigsawType = 'm';

  get adsVisible() {
    return (
      (!this.appConfigService.isDev && ['1', '0'].includes(this.options['ads_flag'])) ||
      (this.appConfigService.isDev && ['2', '0'].includes(this.options['ads_flag']))
    );
  }

  private options: OptionEntity = {};
  private pageIndex = '';

  constructor(
    private readonly destroy$: DestroyService,
    private readonly platform: PlatformService,
    private readonly appConfigService: AppConfigService,
    private readonly commonService: CommonService,
    private readonly optionService: OptionService,
    private readonly postService: PostService,
    private readonly wallpaperService: WallpaperService,
    private readonly gameService: GameService,
    private readonly jigsawService: JigsawService
  ) {
    this.domains = this.appConfigService.apps;
  }

  ngOnInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        this.options = options;
      });
    this.commonService.pageIndex$
      .pipe(
        skipWhile((page) => !page),
        takeUntil(this.destroy$)
      )
      .subscribe((page) => {
        if (this.pageIndex !== page) {
          this.pageIndex = page;
          this.indexInfo = this.commonService.getPageIndexInfo(page);

          const { isPost, isWallpaper, isJigsaw, isGame, isTool, isPage, isSearch } = this.indexInfo;

          if (isPost || isPage || isTool || isSearch) {
            this.getHotPosts();
          } else {
            this.hotPosts = [];
          }
          if (isWallpaper || isPage || isTool || isSearch) {
            this.getHotWallpapers();
          } else {
            this.hotWallpapers = [];
          }
          if (isGame || isPage || isTool || isSearch) {
            this.getHotGames();
          } else {
            this.hotGames = [];
          }
          if (isPost) {
            this.getPostArchives();
            this.getRandomPosts();
          } else {
            this.postArchives = [];
            this.randomPosts = [];
          }
          if (isWallpaper) {
            this.getWallpaperArchives();
          } else {
            this.wallpaperArchives = [];
          }
          if (isWallpaper || isJigsaw) {
            this.getRandomWallpapers();
          } else {
            this.randomWallpapers = [];
          }
          if (isGame) {
            this.getRecentGames();
            this.getRandomGames();
          } else {
            this.recentGames = [];
            this.randomGames = [];
          }
          if (isJigsaw) {
            this.getHotJigsaws();
          } else {
            this.hotJigsaws = [];
          }
        }
      });
  }

  ngAfterViewInit(): void {
    if (this.platform.isBrowser) {
      window.addEventListener('scroll', this.scrollHandler.bind(this));
      window.addEventListener('resize', this.scrollHandler.bind(this));
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
      .getHotJigsaws(this.hotJigsawType)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.hotJigsaws = res;
      });
  }

  private getHotPosts() {
    this.postService
      .getHotPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.hotPosts = res;
      });
  }

  private getRandomPosts() {
    this.postService
      .getRandomPosts(10, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.randomPosts = res;
      });
  }

  private getPostArchives() {
    this.postService
      .getPostArchives(true, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.postArchives = res;
      });
  }

  private getHotWallpapers() {
    this.wallpaperService
      .getHotWallpapers(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.hotWallpapers = res;
      });
  }

  private getRandomWallpapers() {
    this.wallpaperService
      .getRandomWallpapers(10, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.randomWallpapers = res;
      });
  }

  private getWallpaperArchives() {
    this.wallpaperService
      .getWallpaperArchives(true, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.wallpaperArchives = res;
      });
  }

  private getHotGames() {
    this.gameService
      .getHotGames()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.hotGames = res;
      });
  }

  private getRandomGames() {
    this.gameService
      .getRandomGames(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.randomGames = res;
      });
  }

  private getRecentGames() {
    this.gameService
      .getRecentGames(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.recentGames = res;
      });
  }

  private scrollHandler() {
    const docEle = document.documentElement;
    if (this.siderEle && docEle.scrollTop > 0) {
      if (docEle.scrollTop > this.siderEle.nativeElement.scrollHeight - docEle.clientHeight) {
        this.siderEle.nativeElement.style.position = 'sticky';
        if (this.siderEle.nativeElement.scrollHeight < docEle.clientHeight) {
          this.siderEle.nativeElement.style.top = 0;
        } else {
          this.siderEle.nativeElement.style.top =
            docEle.clientHeight - this.siderEle.nativeElement.scrollHeight - 16 + 'px';
        }
      } else {
        this.siderEle.nativeElement.style.position = 'relative';
        this.siderEle.nativeElement.style.top = '';
      }
    }
  }
}
