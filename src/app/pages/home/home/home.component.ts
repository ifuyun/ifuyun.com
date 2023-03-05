import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, RouterLink } from '@angular/router';
import { isEmpty, omit, uniq } from 'lodash';
import { combineLatestWith, skipWhile, takeUntil, tap } from 'rxjs';
import { environment as env } from '../../../../environments/environment';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { CarouselComponent } from '../../../components/carousel/carousel.component';
import { EmptyComponent } from '../../../components/empty/empty.component';
import { JdUnionGoodsComponent } from '../../../components/jd-union-goods/jd-union-goods.component';
import { PageBarComponent } from '../../../components/page-bar/page-bar.component';
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
import { NumberViewPipe } from '../../../pipes/number-view.pipe';
import { OptionService } from '../../../services/option.service';
import { SearchService } from '../../../services/search.service';
import { PostItemComponent } from '../../post/post-item/post-item.component';
import { PostListViewComponent } from '../../post/post-list-view/post-list-view.component';
import { Post } from '../../post/post.interface';
import { PostService } from '../../post/post.service';
import { WallpaperItemComponent } from '../../wallpaper/wallpaper-item/wallpaper-item.component';
import { WallpaperListViewComponent } from '../../wallpaper/wallpaper-list-view/wallpaper-list-view.component';
import { BING_DOMAIN } from '../../wallpaper/wallpaper.constant';
import { Wallpaper, WallpaperLang } from '../../wallpaper/wallpaper.interface';
import { WallpaperService } from '../../wallpaper/wallpaper.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less'],
  providers: [DestroyService],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BreadcrumbComponent,
    CarouselComponent,
    EmptyComponent,
    PostListViewComponent,
    PostItemComponent,
    WallpaperListViewComponent,
    WallpaperItemComponent,
    PageBarComponent,
    JdUnionGoodsComponent,
    DatePipe,
    NumberViewPipe
  ]
})
export class HomeComponent extends PageComponent implements OnInit {
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
        this.updatePageInfo();
      });
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

        if (this.platform.isBrowser) {
          this.searchList.forEach((item) => {
            if (item.type === SearchType.POST) {
              item.data = this.postService.checkPostVoteStatus(<Post>item.data);
            } else if (item.type === SearchType.WALLPAPER) {
              item.data = this.wallpaperService.checkWallpaperVoteStatus(
                this.transformWallpapers(<Wallpaper>item.data)
              );
            }
          });
        }
        this.paginatorData = this.paginator.getPaginator(this.page, this.total, this.pageSize);
      });
  }

  private transformWallpapers<T extends Wallpaper | Wallpaper[]>(wallpapers: T): T {
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
    const titles = [this.options['site_name']];
    let description = '';
    const keywords: string[] = (this.options['site_keywords'] || '').split(',');
    if (this.bizType === 'search') {
      titles.unshift(this.keyword, '搜索');
      description += `「${this.keyword}」搜索结果`;
      keywords.unshift(...this.keyword.split(/\s+/i));

      if (this.page > 1) {
        titles.unshift(`第${this.page}页`);
        if (description) {
          description += `(第${this.page}页)`;
        }
      }
      description += '。';
    } else {
      titles.unshift(this.options['site_slogan']);
    }
    description += `${this.options['site_description']}`;

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords).join(','),
      author: this.options['site_author']
    });
  }
}
