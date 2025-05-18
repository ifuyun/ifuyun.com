import { NgFor } from '@angular/common';
import { HttpStatusCode } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  BreadcrumbComponent,
  GameItemComponent,
  MakeMoneyComponent,
  PaginationComponent,
  PostItemComponent,
  WallpaperItemComponent
} from 'common/components';
import {
  BreadcrumbEntity,
  BreadcrumbService,
  CustomError,
  DestroyService,
  Message,
  MetaService,
  OptionEntity,
  PaginationService,
  UserAgentService
} from 'common/core';
import { ListMode, SearchType } from 'common/enums';
import {
  AllSearchResponse,
  GameSearchResponse,
  PostSearchResponse,
  TenantAppModel,
  WallpaperSearchResponse
} from 'common/interfaces';
import { CommonService, OptionService, TenantAppService } from 'common/services';
import { isEmpty, uniq } from 'lodash';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { SearchService } from './search.service';

@Component({
  selector: 'app-search',
  imports: [
    NgFor,
    NzEmptyModule,
    BreadcrumbComponent,
    PaginationComponent,
    PostItemComponent,
    WallpaperItemComponent,
    GameItemComponent,
    MakeMoneyComponent
  ],
  providers: [DestroyService],
  templateUrl: './search.component.html',
  styleUrl: './search.component.less'
})
export class SearchComponent implements OnInit {
  isMobile = false;
  page = 1;
  pageSize = 10;
  total = 0;
  searchType: Exclude<SearchType, SearchType.ALL> | '' = '';
  searchResult: AllSearchResponse[] = [];
  postResult: PostSearchResponse[] = [];
  wallpaperResult: WallpaperSearchResponse[] = [];
  gameResult: GameSearchResponse[] = [];

  protected readonly ListMode = ListMode;

  protected pageIndex = 'search';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private keyword = '';

  private get searchTypeDesc() {
    const typeMap: Record<string, string> = {
      [SearchType.POST]: '文章',
      [SearchType.WALLPAPER]: '壁纸',
      [SearchType.GAME]: '游戏'
    };
    return this.searchType ? typeMap[<string>this.searchType] : '全站';
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly paginationService: PaginationService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly searchService: SearchService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.queryParamMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, qp]) => {
        this.appInfo = appInfo;
        this.options = options;

        this.pageSize = Number(this.options['post_page_size']) || 10;
        this.page = Number(qp.get('page')) || 1;
        this.keyword = qp.get('keyword')?.trim() || '';
        this.searchType = <Exclude<SearchType, SearchType.ALL>>qp.get('type')?.trim() || '';
        this.searchType = [SearchType.POST, SearchType.WALLPAPER, SearchType.GAME].includes(<SearchType>this.searchType)
          ? this.searchType
          : '';
        this.pageIndex = this.searchType ? `${this.searchType}-search` : 'search';

        this.updatePageIndex();
        this.updatePageInfo();
        this.updateBreadcrumbs();

        if (!this.keyword) {
          throw new CustomError(Message.SEARCH_KEYWORD_IS_NULL, HttpStatusCode.BadRequest);
        }
        this.search();
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private search() {
    const param = {
      keyword: this.keyword,
      page: this.page
    };
    if (this.searchType === SearchType.POST) {
      this.searchService
        .searchPosts(param)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.postResult = res.list;
          this.initData(res.page, res.total);
        });
    } else if (this.searchType === SearchType.WALLPAPER) {
      this.searchService
        .searchWallpapers(param)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.wallpaperResult = res.list;
          this.initData(res.page, res.total);
        });
    } else if (this.searchType === SearchType.GAME) {
      this.searchService
        .searchGames(param)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.gameResult = res.list;
          this.initData(res.page, res.total);
        });
    } else {
      this.searchService
        .searchAll(param)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.searchResult = res.list;
          this.initData(res.page, res.total);
        });
    }
  }

  private initData(page: number, total: number): void {
    this.page = page || 1;
    this.total = total || 0;

    this.paginationService.updatePagination({
      page: this.page,
      total: this.total,
      pageSize: this.pageSize,
      url: '/search',
      param: {
        type: this.searchType || undefined,
        keyword: this.keyword
      }
    });
  }

  private updatePageInfo() {
    const titles: string[] = [this.keyword, `${this.searchTypeDesc}搜索`, this.appInfo.appName];
    const keywords: string[] = [...this.appInfo.keywords];
    let description = `「${this.keyword}」${this.searchTypeDesc}搜索结果`;

    keywords.unshift(...this.keyword.split(/\s+/i));

    if (this.page > 1) {
      titles.unshift(`第${this.page}页`);
      if (description) {
        description += `(第${this.page}页)`;
      }
    }
    description += '。';
    description += this.appInfo.appDescription;

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords)
        .filter((item) => !!item)
        .join(','),
      author: this.options['site_author']
    });
  }

  private updateBreadcrumbs() {
    if (!this.keyword) {
      this.breadcrumbService.updateBreadcrumbs([]);
      return;
    }
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: `${this.searchTypeDesc}搜索`,
        tooltip: `${this.searchTypeDesc}搜索`,
        url: '',
        isHeader: false
      },
      {
        label: this.keyword,
        tooltip: this.keyword,
        url: '/search',
        domain: 'www',
        param: {
          type: this.searchType || undefined,
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

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
