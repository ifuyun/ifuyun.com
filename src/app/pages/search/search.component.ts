import { NgForOf } from '@angular/common';
import { HttpStatusCode } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { MakeMoneyComponent } from '../../components/make-money/make-money.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { PostItemComponent } from '../../components/post-item/post-item.component';
import { WallpaperItemComponent } from '../../components/wallpaper-item/wallpaper-item.component';
import { Message } from '../../config/message.enum';
import { WallpaperListMode } from '../../enums/wallpaper';
import { BreadcrumbEntity } from '../../interfaces/breadcrumb';
import { CustomError } from '../../interfaces/custom-error';
import { OptionEntity } from '../../interfaces/option';
import { SearchResponse } from '../../interfaces/search';
import { TenantAppModel } from '../../interfaces/tenant-app';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { CommonService } from '../../services/common.service';
import { DestroyService } from '../../services/destroy.service';
import { MetaService } from '../../services/meta.service';
import { OptionService } from '../../services/option.service';
import { PaginationService } from '../../services/pagination.service';
import { SearchService } from '../../services/search.service';
import { TenantAppService } from '../../services/tenant-app.service';
import { UserAgentService } from '../../services/user-agent.service';

@Component({
  selector: 'app-search',
  imports: [
    NgForOf,
    NzEmptyModule,
    BreadcrumbComponent,
    PaginationComponent,
    PostItemComponent,
    WallpaperItemComponent,
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
  keyword = '';
  searchResult: SearchResponse[] = [];

  protected readonly WallpaperListMode = WallpaperListMode;

  protected pageIndex = 'search';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};

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
    this.updatePageIndex();

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

        this.updatePageInfo();
        this.updateBreadcrumbs();

        if (!this.keyword) {
          throw new CustomError(Message.SEARCH_KEYWORD_IS_NULL, HttpStatusCode.BadRequest);
        }
        this.getSearchResults();
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getSearchResults() {
    this.searchService
      .search({
        keyword: this.keyword,
        page: this.page
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.searchResult = res.list;
        this.page = res.page || 1;
        this.total = res.total || 0;

        this.paginationService.updatePagination({
          page: this.page,
          total: this.total,
          pageSize: this.pageSize,
          url: '/search',
          param: {
            keyword: this.keyword
          }
        });
      });
  }

  private updatePageInfo() {
    const titles: string[] = ['搜索', this.appInfo.appName];
    const keywords: string[] = [...this.appInfo.keywords];
    let description = `「${this.keyword}」搜索结果`;
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
      keywords: uniq(keywords).join(','),
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
        label: '搜索',
        tooltip: '搜索',
        url: '',
        isHeader: false
      },
      {
        label: this.keyword,
        tooltip: this.keyword,
        url: '/search',
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

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
