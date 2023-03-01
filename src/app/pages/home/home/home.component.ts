import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { isEmpty, omit } from 'lodash';
import { combineLatestWith, skipWhile, takeUntil, tap } from 'rxjs';
import { environment as env } from '../../../../environments/environment';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { BLANK_IMAGE } from '../../../config/common.constant';
import { SearchType } from '../../../config/common.enum';
import { SearchResponse } from '../../../core/common.interface';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PaginatorEntity } from '../../../core/paginator.interface';
import { PaginatorService } from '../../../core/paginator.service';
import { PlatformService } from '../../../core/platform.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { filterHtmlTag, truncateString } from '../../../helpers/helper';
import { OptionEntity } from '../../../interfaces/option.interface';
import { OptionService } from '../../../services/option.service';
import { SearchService } from '../../../services/search.service';
import { Post } from '../../post/post.interface';
import { PostService } from '../../post/post.service';
import { BING_DOMAIN } from '../../wallpaper/wallpaper.constant';
import { Wallpaper, WallpaperLang } from '../../wallpaper/wallpaper.interface';
import { WallpaperService } from '../../wallpaper/wallpaper.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less'],
  providers: [DestroyService]
})
export class HomeComponent extends PageComponent implements OnInit {
  readonly blankImage = BLANK_IMAGE;

  isMobile = false;
  pageIndex = 'index';
  options: OptionEntity = {};
  keyword = '';
  postList: Post[] = [];
  wallpapers: Wallpaper[] = [];
  page = 1;
  total = 0;
  bizType: 'init' | 'index' | 'search' = 'init';
  searchList: SearchResponse[] = [];
  paginatorData: PaginatorEntity | null = null;
  pageUrl = '/';
  pageUrlParam: Params = {};

  private pageSize = 10;
  private wallpaperURLPrefix = '';

  constructor(
    private route: ActivatedRoute,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private destroy$: DestroyService,
    private metaService: MetaService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private optionService: OptionService,
    private postService: PostService,
    private paginator: PaginatorService,
    private wallpaperService: WallpaperService,
    private searchService: SearchService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updatePageOptions();
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        combineLatestWith(this.route.queryParamMap),
        takeUntil(this.destroy$),
        tap(([, queryParams]) => {
          this.page = Number(queryParams.get('page')) || 1;
          this.keyword = queryParams.get('keyword')?.trim() || '';
        })
      )
      .subscribe(([options]) => {
        this.options = options;
        this.wallpaperURLPrefix = env.production ? this.options['wallpaper_server'] : BING_DOMAIN;
        this.pageUrlParam = omit({ ...this.route.snapshot.queryParams }, ['page']);
        this.updatePageInfo();
        if (this.keyword) {
          this.pageIndex = 'search';
          this.bizType = 'search';
          this.updateBreadcrumb();
          this.search();
        } else {
          this.bizType = 'index';
          this.fetchPosts();
          this.fetchWallpapers();
        }
        this.updateActivePage();
      });
  }

  getWallpaperLangParams(wallpaper: Wallpaper): Params {
    return !!wallpaper.bingIdCn ? {} : { lang: WallpaperLang.EN };
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }

  protected updatePageOptions(): void {
    this.commonService.updatePageOptions({
      showHeader: true,
      showFooter: true,
      showMobileHeader: true,
      showMobileFooter: true
    });
  }

  private fetchPosts() {
    this.postService
      .getPosts({
        page: 1,
        sticky: 0
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.postList = res.postList?.list || [];
        if (this.platform.isBrowser) {
          this.postList = this.postService.checkPostVoteStatus(this.postList);
        }
      });
  }

  private fetchWallpapers() {
    this.wallpaperService
      .getWallpapers({
        page: 1,
        pageSize: 10,
        lang: [WallpaperLang.CN, WallpaperLang.EN]
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.wallpapers = this.transformWallpapers(res.list || []);
        if (this.platform.isBrowser) {
          this.wallpapers = this.wallpaperService.checkWallpaperVoteStatus(this.wallpapers);
        }
      });
  }

  private search() {
    this.searchService
      .searchAll({
        keyword: this.keyword,
        page: this.page
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.searchList = res.list || [];
        this.page = res.page || 1;
        this.total = res.total || 0;

        this.searchList.forEach((item) => {
          if (item.type === SearchType.POST) {
            item.data = this.postService.checkPostVoteStatus(<Post>item.data);
          } else if (item.type === SearchType.WALLPAPER) {
            item.data = this.wallpaperService.checkWallpaperVoteStatus(this.transformWallpapers(<Wallpaper>item.data));
          }
        });
        this.paginatorData = this.paginator.getPaginator(this.page, this.total, this.pageSize);
      });
  }

  private transformWallpapers<T extends (Wallpaper | Wallpaper[])>(wallpapers: T): T {
    const transformFn = (wallpaper: Wallpaper) => {
      const wallpaperLocation = !!wallpaper.bingIdCn
        ? wallpaper.wallpaperLocation || '未知'
        : wallpaper.wallpaperLocationEn || 'Unknown';
      return {
        ...wallpaper,
        wallpaperCopyright: wallpaper.wallpaperCopyright || wallpaper.wallpaperCopyrightEn,
        wallpaperLocation,
        wallpaperStory: truncateString(filterHtmlTag(wallpaper.wallpaperStory || wallpaper.wallpaperStoryEn), 140),
        wallpaperUrl: this.wallpaperURLPrefix + wallpaper.wallpaperUrl,
        wallpaperThumbUrl: this.wallpaperURLPrefix + wallpaper.wallpaperThumbUrl
      };
    };
    if (!Array.isArray(wallpapers)) {
      return transformFn(wallpapers) as T;
    }
    return wallpapers.map(transformFn) as T;
  }

  private updateBreadcrumb() {
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '搜索',
        tooltip: '搜索',
        url: '',
        isHeader: false
      },
      {
        label: this.keyword,
        tooltip: this.keyword,
        url: '/',
        param: {
          keyword: this.keyword
        },
        isHeader: true
      }
    ];
    if (this.page > 1) {
      breadcrumbs.push({
        label: `第${this.page}页`,
        tooltip: `第${this.page}页`,
        url: '',
        isHeader: false
      });
    }
    this.breadcrumbService.updateBreadcrumb(breadcrumbs);
  }

  private updatePageInfo() {
    const titles = [this.options['site_slogan'], this.options['site_name']];

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description: this.options['site_description'],
      keywords: this.options['site_keywords'],
      author: this.options['site_author']
    });
  }
}
