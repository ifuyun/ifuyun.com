import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  BreadcrumbComponent,
  MakeMoneyComponent,
  PaginationComponent,
  WallpaperItemComponent
} from 'common/components';
import {
  BreadcrumbEntity,
  BreadcrumbService,
  DestroyService,
  MetaService,
  OptionEntity,
  PaginationService,
  UserAgentService
} from 'common/core';
import { ListMode, WallpaperLang } from 'common/enums';
import { TenantAppModel, Wallpaper, WallpaperQueryParam } from 'common/interfaces';
import { CommonService, OptionService, TenantAppService, WallpaperService } from 'common/services';
import { isEmpty, uniq } from 'lodash';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-wallpaper-jigsaw-list',
  imports: [
    NgFor,
    FormsModule,
    NzIconModule,
    NzRadioModule,
    NzEmptyModule,
    BreadcrumbComponent,
    PaginationComponent,
    WallpaperItemComponent,
    MakeMoneyComponent
  ],
  providers: [DestroyService],
  templateUrl: './wallpaper-jigsaw-list.component.html',
  styleUrls: ['./wallpaper-jigsaw-list.component.less']
})
export class WallpaperJigsawListComponent implements OnInit {
  isMobile = false;
  page = 1;
  pageSize = 10;
  total = 0;
  wallpapers: Wallpaper[] = [];

  protected readonly WallpaperLang = WallpaperLang;
  protected readonly ListMode = ListMode;

  protected pageIndex = 'jigsaw';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private lastParam = '';

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
    private readonly wallpaperService: WallpaperService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    combineLatest([
      this.tenantAppService.appInfo$,
      this.optionService.options$,
      this.route.paramMap,
      this.route.queryParamMap
    ])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        const { queryParamMap: qp } = this.route.snapshot;

        this.appInfo = appInfo;
        this.options = options;

        this.pageSize = Number(this.options['wallpaper_page_size']) || 10;
        this.page = Number(qp.get('page')) || 1;

        const latestParam = JSON.stringify({
          page: this.page
        });
        if (latestParam === this.lastParam) {
          return;
        }
        this.lastParam = latestParam;

        this.updatePageIndex();
        this.getWallpapers();
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getWallpapers() {
    const param: WallpaperQueryParam = {
      page: this.page,
      pageSize: this.pageSize
    };

    this.wallpaperService
      .getWallpapers(param)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.page = res.page || 1;
        this.total = res.total || 0;
        this.wallpapers = res.list || [];

        this.paginationService.updatePagination({
          page: this.page,
          total: this.total,
          pageSize: this.pageSize,
          url: '/list',
          param: {}
        });

        this.updatePageInfo();
        this.updateBreadcrumbs();
      });
  }

  private updatePageInfo() {
    const siteName = this.appInfo.appName;
    let description = '';
    const titles = ['壁纸拼图', siteName];
    const keywords = (this.options['jigsaw_keywords'] || '').split(',');

    if (description) {
      description += '壁纸拼图';
    }
    if (this.page > 1) {
      titles.unshift(`第${this.page}页`);
      if (description) {
        description += `(第${this.page}页)`;
      }
    }
    if (description) {
      description += '。';
    }
    description += `${siteName}${this.options['jigsaw_description'] || ''}`;

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords)
        .filter((item) => !!item)
        .join(','),
      author: this.options['site_author']
    });
  }

  protected updateBreadcrumbs(): void {
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '壁纸拼图',
        tooltip: '壁纸拼图',
        url: '/',
        domain: 'jigsaw',
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
