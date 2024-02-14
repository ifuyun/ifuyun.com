import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { isEmpty, omit, uniq } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { APP_ID } from '../../../config/common.constant';
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
import { OptionEntity } from '../../../interfaces/option.interface';
import { TenantAppModel } from '../../../interfaces/tenant-app.interface';
import { OptionService } from '../../../services/option.service';
import { SearchService } from '../../../services/search.service';
import { TenantAppService } from '../../../services/tenant-app.service';
import { Post } from '../../post/post.interface';
import { PostService } from '../../post/post.service';
import { Wallpaper, WallpaperLang } from '../../wallpaper/wallpaper.interface';
import { WallpaperService } from '../../wallpaper/wallpaper.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less'],
  providers: [DestroyService]
})
export class HomeComponent extends PageComponent implements OnInit {
  isMobile = false;
  pageIndex = 'index';
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

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private pageSize = 10;

  constructor(
    private route: ActivatedRoute,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private destroy$: DestroyService,
    private metaService: MetaService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private tenantAppService: TenantAppService,
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

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.queryParamMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, qp]) => {
        this.appInfo = appInfo;
        this.options = options;
        this.pageUrlParam = omit({ ...this.route.snapshot.queryParams }, ['page']);
        this.page = Number(qp.get('page')) || 1;
        this.keyword = qp.get('keyword')?.trim() || '';

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
        sticky: 0,
        appId: APP_ID
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
        lang: [WallpaperLang.CN, WallpaperLang.EN],
        appId: APP_ID
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
      .search({
        keyword: this.keyword,
        page: this.page,
        appId: APP_ID
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
        wallpaperStory: wallpaper.wallpaperStory || wallpaper.wallpaperStoryEn
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
    const titles = [this.appInfo.appName];
    let description = '';
    const keywords: string[] = this.appInfo.keywords;
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
      titles.unshift(this.appInfo.appSlogan);
    }
    description += `${this.appInfo.appDescription}`;

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords).join(','),
      author: this.options['site_author']
    });
  }
}
