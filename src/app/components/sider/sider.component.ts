import { NgFor, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { skipWhile, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WallpaperLang } from '../../enums/wallpaper';
import { BookEntity } from '../../interfaces/book';
import { ArchiveData, PageIndexInfo } from '../../interfaces/common';
import { GameEntity } from '../../interfaces/game';
import { OptionEntity } from '../../interfaces/option';
import { PostEntity } from '../../interfaces/post';
import { HotWallpaper, Wallpaper } from '../../interfaces/wallpaper';
import { BookService } from '../../services/book.service';
import { CommonService } from '../../services/common.service';
import { DestroyService } from '../../services/destroy.service';
import { GameService } from '../../services/game.service';
import { OptionService } from '../../services/option.service';
import { PlatformService } from '../../services/platform.service';
import { PostService } from '../../services/post.service';
import { UserAgentService } from '../../services/user-agent.service';
import { WallpaperService } from '../../services/wallpaper.service';
import { AdsenseComponent } from '../adsense/adsense.component';

@Component({
  selector: 'app-sider',
  imports: [RouterLink, NgIf, NgFor, NzIconModule, AdsenseComponent],
  providers: [DestroyService],
  templateUrl: './sider.component.html',
  styleUrl: './sider.component.less'
})
export class SiderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('siderEle') siderEle!: ElementRef;

  readonly adsPlaceholder = true;

  isMobile = false;
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
  bookPosts: PostEntity[] = [];
  activeBook?: BookEntity;

  get bookName() {
    return this.bookService.getBookName(this.activeBook).fullName;
  }

  get adsVisible() {
    return (
      (environment.production && ['1', '0'].includes(this.options['ads_flag'])) ||
      (!environment.production && ['2', '0'].includes(this.options['ads_flag']))
    );
  }

  private options: OptionEntity = {};
  private pageIndex = '';

  constructor(
    private readonly destroy$: DestroyService,
    private readonly platform: PlatformService,
    private readonly userAgentService: UserAgentService,
    private readonly commonService: CommonService,
    private readonly optionService: OptionService,
    private readonly postService: PostService,
    private readonly wallpaperService: WallpaperService,
    private readonly gameService: GameService,
    private readonly bookService: BookService
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

          if (!this.isMobile) {
            const { isPost, isWallpaper, isGame, isTool, isPage, isSearch } = this.indexInfo;

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
              this.getRandomWallpapers();
            } else {
              this.wallpaperArchives = [];
              this.randomWallpapers = [];
            }
            if (isGame) {
              this.getRecentGames();
              this.getRandomGames();
            } else {
              this.randomGames = [];
            }
          }
        }
      });
    this.postService.activeBook$.pipe(takeUntil(this.destroy$)).subscribe((book) => {
      this.activeBook = book;
      if (book) {
        this.getPostsByBookId();
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

  private getPostsByBookId() {
    this.postService
      .getPostsByBookId<{ posts: PostEntity[] }>({
        page: 1,
        pageSize: 10,
        bookId: this.activeBook?.bookId,
        simple: 1
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.bookPosts = res.posts || [];
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
