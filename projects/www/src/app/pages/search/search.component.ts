import { HttpStatusCode } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
  UserAgentService
} from 'common/core';
import { ListMode, SearchType } from 'common/enums';
import {
  AllSearchResponse,
  GameSearchResponse,
  PostSearchResponse,
  TenantAppVo,
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
    NzEmptyModule,
    BreadcrumbComponent,
    PaginationComponent,
    PostItemComponent,
    WallpaperItemComponent,
    GameItemComponent,
    MakeMoneyComponent
  ],
  providers: [DestroyService],
  templateUrl: './search.component.html'
})
export class SearchComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly searchService = inject(SearchService);

  readonly isMobile = this.uaService.isMobile;
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly total = signal(0);
  readonly searchType = signal<Exclude<SearchType, SearchType.ALL> | ''>('');
  readonly searchResult = signal<AllSearchResponse[]>([]);
  readonly postResult = signal<PostSearchResponse[]>([]);
  readonly wallpaperResult = signal<WallpaperSearchResponse[]>([]);
  readonly gameResult = signal<GameSearchResponse[]>([]);
  readonly paginationUrl = '/search';
  readonly paginationParams = computed(() => {
    return {
      type: this.searchType() || undefined,
      keyword: this.keyword()
    };
  });

  protected readonly ListMode = ListMode;
  protected readonly pageIndex = signal('search');

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});
  private readonly keyword = signal('');
  private readonly searchTypeDesc = computed(() => {
    const typeMap: Record<string, string> = {
      [SearchType.POST]: '博客',
      [SearchType.WALLPAPER]: '壁纸',
      [SearchType.GAME]: '游戏'
    };
    return this.searchType() ? typeMap[<string>this.searchType()] : '全站';
  });

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.queryParamMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, qp]) => {
        this.appInfo.set(appInfo);
        this.options.set(options);

        this.pageSize.set(Number(this.options()['post_page_size']) || 10);
        this.page.set(Number(qp.get('page')) || 1);
        this.keyword.set(qp.get('keyword')?.trim() || '');

        const searchType = <Exclude<SearchType, SearchType.ALL>>qp.get('type')?.trim() || '';
        this.searchType.set(
          [SearchType.POST, SearchType.WALLPAPER, SearchType.GAME].includes(<SearchType>searchType) ? searchType : ''
        );
        this.pageIndex.set(searchType ? `${searchType}-search` : 'search');

        this.updatePageIndex();
        this.updatePageInfo();
        this.updateBreadcrumbs();

        if (!this.keyword()) {
          throw new CustomError(Message.SEARCH_KEYWORD_IS_NULL, HttpStatusCode.BadRequest);
        }
        this.search();
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex());
  }

  private search() {
    const param = {
      keyword: this.keyword(),
      page: this.page()
    };
    if (this.searchType() === SearchType.POST) {
      this.searchService
        .searchPosts(param)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.postResult.set(res.list);
          this.initData(res.page, res.total);
        });
    } else if (this.searchType() === SearchType.WALLPAPER) {
      this.searchService
        .searchWallpapers(param)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.wallpaperResult.set(res.list);
          this.initData(res.page, res.total);
        });
    } else if (this.searchType() === SearchType.GAME) {
      this.searchService
        .searchGames(param)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.gameResult.set(res.list);
          this.initData(res.page, res.total);
        });
    } else {
      this.searchService
        .searchAll(param)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.searchResult.set(res.list);
          this.initData(res.page, res.total);
        });
    }
  }

  private initData(page: number, total: number): void {
    this.page.set(page || 1);
    this.total.set(total || 0);
  }

  private updatePageInfo() {
    const titles: string[] = [this.keyword(), `${this.searchTypeDesc()}搜索`, this.appInfo()!.name];
    const keywords: string[] = [...this.appInfo()!.keywordList];
    let description = `「${this.keyword()}」${this.searchTypeDesc()}搜索结果`;

    keywords.unshift(...this.keyword().split(/\s+/i));

    if (this.page() > 1) {
      titles.unshift(`第${this.page()}页`);
      if (description) {
        description += `(第${this.page()}页)`;
      }
    }
    description += '。';
    description += this.appInfo()!.description;

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords)
        .filter((item) => !!item)
        .join(','),
      author: this.options()['site_author']
    });
  }

  private updateBreadcrumbs() {
    if (!this.keyword()) {
      this.breadcrumbService.updateBreadcrumbs([]);
      return;
    }
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: `${this.searchTypeDesc()}搜索`,
        tooltip: `${this.searchTypeDesc()}搜索`,
        url: '',
        isHeader: false
      },
      {
        label: this.keyword(),
        tooltip: this.keyword(),
        url: '/search',
        domain: 'www',
        param: {
          type: this.searchType() || undefined,
          keyword: this.keyword()
        },
        isHeader: true
      }
    ];
    if (this.page() > 1) {
      breadcrumbs.push({
        label: `第${this.page()}页`,
        tooltip: `第${this.page()}页`,
        url: '',
        isHeader: false
      });
    }

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
