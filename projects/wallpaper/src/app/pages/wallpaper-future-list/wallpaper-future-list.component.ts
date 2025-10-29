import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, RouterLink } from '@angular/router';
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
  selector: 'app-wallpaper-future-list',
  imports: [
    RouterLink,
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
  templateUrl: './wallpaper-future-list.component.html',
  styleUrl: '../wallpaper-list/wallpaper-list.component.less'
})
export class WallpaperFutureListComponent implements OnInit {
  isMobile = false;
  page = 1;
  pageSize = 10;
  total = 0;
  lang!: WallpaperLang;
  mode!: ListMode;
  langValue!: WallpaperLang | 'all';
  modeValue!: ListMode;
  wallpapers: Wallpaper[] = [];
  paginationUrl = '/future';

  protected readonly WallpaperLang = WallpaperLang;
  protected readonly ListMode = ListMode;

  protected pageIndex = 'wallpaper-future';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private lastParam = '';

  get paginationParam(): Params {
    const params: Params = {};
    if (this.lang) {
      params['lang'] = this.lang;
    }
    if (this.mode) {
      params['mode'] = this.mode;
    }

    return params;
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
    private readonly wallpaperService: WallpaperService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.queryParamMap])
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
        this.lang = <WallpaperLang>qp.get('lang')?.trim();
        this.mode = <ListMode>qp.get('mode')?.trim();
        this.langValue = this.lang || 'all';
        this.modeValue = this.mode || ListMode.CARD;

        const latestParam = JSON.stringify({
          page: this.page,
          lang: this.lang,
          mode: this.mode
        });
        if (latestParam === this.lastParam) {
          return;
        }
        this.lastParam = latestParam;

        this.updatePageIndex();
        this.getFutureWallpapers();
      });
  }

  getListParam(lang: WallpaperLang | null, mode: ListMode, page?: number) {
    const params: Params = {};
    if (lang) {
      params['lang'] = lang;
    }
    if (mode) {
      params['mode'] = mode;
    }
    if (page) {
      params['page'] = page;
    }

    return params;
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getFutureWallpapers() {
    const param: WallpaperQueryParam = {
      page: this.page,
      size: this.pageSize
    };
    if (this.lang) {
      param.lang = this.lang;
    }

    this.wallpaperService
      .getFutureWallpapers(param)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.page = res.page || 1;
        this.total = res.total || 0;

        const isEn = this.lang === WallpaperLang.EN;
        this.wallpapers = (res.list || []).map((item) => {
          return {
            ...item,
            wallpaperCopyright: isEn ? item.wallpaperCopyrightEn : item.wallpaperCopyright,
            wallpaperLocation: isEn ? item.wallpaperLocationEn : item.wallpaperLocation,
            wallpaperStory: isEn ? item.wallpaperStoryEn : item.wallpaperStory
          };
        });

        this.paginationService.updatePagination({
          page: this.page,
          total: this.total,
          pageSize: this.pageSize,
          url: this.paginationUrl,
          param: this.paginationParam
        });

        this.updatePageInfo();
        this.updateBreadcrumbs();
      });
  }

  private updatePageInfo() {
    const titles = ['未来壁纸', '高清壁纸', this.appInfo.appName];
    const keywords = (this.options['wallpaper_keywords'] || '').split(',');
    let description = '';

    if (this.page > 1) {
      titles.unshift(`第${this.page}页`);
      if (description) {
        description += `第${this.page}页。`;
      }
    }
    description += this.options['wallpaper_future_description'];

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(['明日必应', '未来壁纸'].concat(keywords))
        .filter((item) => !!item)
        .join(','),
      author: this.options['site_author']
    });
  }

  protected updateBreadcrumbs(): void {
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '壁纸',
        tooltip: '高清壁纸',
        url: '/',
        domain: 'wallpaper',
        isHeader: false
      },
      {
        label: '未来壁纸',
        tooltip: '未来壁纸',
        url: '/future',
        domain: 'wallpaper',
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
