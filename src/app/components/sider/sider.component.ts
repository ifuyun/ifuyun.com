import { CommonModule, DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Params, Router, RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { environment as env } from '../../../environments/environment';
import { APP_ID } from '../../config/common.constant';
import { ArchiveData } from '../../core/common.interface';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { UrlService } from '../../core/url.service';
import { LinkEntity } from '../../interfaces/link.interface';
import { Action, ActionObjectType } from '../../interfaces/log.enum';
import { OptionEntity } from '../../interfaces/option.interface';
import { NgZorroAntdModule } from '../../modules/antd/ng-zorro-antd.module';
import { PostEntity } from '../../pages/post/post.interface';
import { PostService } from '../../pages/post/post.service';
import { HotWallpaper, Wallpaper, WallpaperLang } from '../../pages/wallpaper/wallpaper.interface';
import { WallpaperService } from '../../pages/wallpaper/wallpaper.service';
import { LinkService } from '../../services/link.service';
import { LogService } from '../../services/log.service';
import { OptionService } from '../../services/option.service';
import { AdsenseComponent } from '../adsense/adsense.component';
import { JdUnionGoodsComponent } from '../jd-union-goods/jd-union-goods.component';

@Component({
  selector: 'app-sider',
  templateUrl: './sider.component.html',
  styleUrls: ['./sider.component.less'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgZorroAntdModule, AdsenseComponent, JdUnionGoodsComponent],
  providers: [DestroyService]
})
export class SiderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('redPacket') redPacketEle!: ElementRef;

  isMobile = false;
  pageIndex = '';
  isHomePage = false;
  isPostPage = false;
  isWallpaperPage = false;
  hotPosts: PostEntity[] = [];
  randomPosts: PostEntity[] = [];
  postArchives: ArchiveData[] = [];
  hotWallpapers: HotWallpaper[] = [];
  randomWallpapers: Wallpaper[] = [];
  wallpaperArchives: ArchiveData[] = [];
  friendLinks: LinkEntity[] = [];
  keyword = '';
  adsFlag = false;
  jdUnionVisible = false;

  private options: OptionEntity = {};

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private destroy$: DestroyService,
    private platform: PlatformService,
    private router: Router,
    private urlService: UrlService,
    private commonService: CommonService,
    private optionService: OptionService,
    private postService: PostService,
    private linkService: LinkService,
    private wallpaperService: WallpaperService,
    private logService: LogService
  ) {}

  ngOnInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        this.options = options;
        const adsFlag = this.options['ads_flag'] || '';
        this.adsFlag =
          (env.production && ['1', '0'].includes(adsFlag)) || (!env.production && ['2', '0'].includes(adsFlag));
      });
    this.urlService.urlInfo$.pipe(takeUntil(this.destroy$)).subscribe((url) => {
      const isHome = url.current.split('?')[0] === '/';
      this.linkService
        .getFriendLinks(isHome)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => (this.friendLinks = res));
    });
    this.commonService.adsFlag$.pipe(takeUntil(this.destroy$)).subscribe((flag) => {
      this.jdUnionVisible = flag;
    });
    this.commonService.pageIndex$
      .pipe(
        skipWhile((page) => !page),
        takeUntil(this.destroy$)
      )
      .subscribe((page) => {
        this.pageIndex = page;
        this.updatePageIndex();
        if (this.isHomePage || this.isPostPage) {
          this.fetchHotPosts();
          this.fetchRandomPosts();
          this.fetchPostArchives();
        }
        if (this.isHomePage || this.isWallpaperPage) {
          this.fetchHotWallpapers();
          this.fetchRandomWallpapers();
          this.fetchWallpaperArchives();
        }
      });
  }

  ngAfterViewInit() {
    if (this.platform.isBrowser) {
      window.addEventListener('scroll', this.scrollHandler);
      window.addEventListener('resize', this.scrollHandler);
    }
  }

  ngOnDestroy() {
    if (this.platform.isBrowser) {
      window.removeEventListener('scroll', this.scrollHandler);
      window.removeEventListener('resize', this.scrollHandler);
    }
  }

  search(event?: KeyboardEvent) {
    if (event && event.key !== 'Enter') {
      return;
    }
    this.keyword = this.keyword.trim();
    if (this.keyword) {
      this.logService
        .logAction({
          action: Action.SEARCH,
          objectType: ActionObjectType.SEARCH,
          keyword: this.keyword,
          appId: APP_ID
        })
        .subscribe();
      this.router.navigate(['/'], { queryParams: { keyword: this.keyword } });
    }
  }

  getWallpaperLangParams(isCn: boolean): Params {
    return isCn ? {} : { lang: WallpaperLang.EN };
  }

  private fetchHotPosts() {
    this.postService
      .getHotPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.hotPosts = res));
  }

  private fetchRandomPosts() {
    this.postService
      .getRandomPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.randomPosts = res));
  }

  private fetchPostArchives() {
    this.postService
      .getPostArchives({
        showCount: true
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.postArchives = res));
  }

  private fetchHotWallpapers() {
    this.wallpaperService
      .getHotWallpapers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.hotWallpapers = res.map((item) => {
          return {
            ...item,
            wallpaperTitle: item.wallpaperTitleCn || item.wallpaperTitleEn,
            wallpaperCopyright: item.wallpaperCopyrightCn || item.wallpaperCopyrightEn,
            isCn: !!item.wallpaperCopyrightCn,
            isEn: !!item.wallpaperCopyrightEn
          };
        });
      });
  }

  private fetchRandomWallpapers() {
    this.wallpaperService
      .getRandomWallpapers({
        size: 10,
        simple: true
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.randomWallpapers = res.map((item) => {
          return {
            ...item,
            wallpaperTitle: item.wallpaperTitle || item.wallpaperTitleEn,
            wallpaperCopyright: item.wallpaperCopyright || item.wallpaperCopyrightEn,
            isCn: !!item.wallpaperCopyright,
            isEn: !!item.wallpaperCopyrightEn
          };
        });
      });
  }

  private fetchWallpaperArchives() {
    this.wallpaperService
      .getWallpaperArchives({
        showCount: true
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.wallpaperArchives = res));
  }

  private scrollHandler() {
    const documentEle = this.document.documentElement;
    const siderEle = this.document.getElementById('sider') as HTMLElement;
    if (siderEle) {
      if (documentEle.scrollTop > 0 && documentEle.scrollTop > siderEle.scrollHeight - documentEle.clientHeight) {
        siderEle.style.position = 'sticky';
        siderEle.style.top = documentEle.clientHeight - siderEle.scrollHeight - 16 + 'px';
      } else {
        siderEle.style.position = 'relative';
        siderEle.style.top = '';
      }
    }
  }

  private updatePageIndex() {
    this.isHomePage = this.pageIndex === 'index';
    this.isPostPage = ['post', 'postArchive'].includes(this.pageIndex);
    this.isWallpaperPage = ['wallpaper', 'wallpaperArchive'].includes(this.pageIndex);
  }
}
