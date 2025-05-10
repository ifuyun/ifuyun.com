import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, RouterLink } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from 'src/app/components/breadcrumb/breadcrumb.component';
import { MakeMoneyComponent } from 'src/app/components/make-money/make-money.component';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { WallpaperItemComponent } from 'src/app/components/wallpaper-item/wallpaper-item.component';
import { ListMode } from 'src/app/enums/common';
import { WallpaperLang } from 'src/app/enums/wallpaper';
import { OptionEntity } from 'src/app/interfaces/option';
import { TenantAppModel } from 'src/app/interfaces/tenant-app';
import { Wallpaper, WallpaperQueryParam } from 'src/app/interfaces/wallpaper';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { CommonService } from 'src/app/services/common.service';
import { DestroyService } from 'src/app/services/destroy.service';
import { MetaService } from 'src/app/services/meta.service';
import { OptionService } from 'src/app/services/option.service';
import { PaginationService } from 'src/app/services/pagination.service';
import { TenantAppService } from 'src/app/services/tenant-app.service';
import { UserAgentService } from 'src/app/services/user-agent.service';
import { WallpaperService } from 'src/app/services/wallpaper.service';

@Component({
  selector: 'app-wallpaper-list',
  imports: [
    NgFor,
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
  templateUrl: './wallpaper-list.component.html',
  styleUrls: ['./wallpaper-list.component.less', '../../post/post-list/post-list.component.less']
})
export class WallpaperListComponent implements OnInit {
  isMobile = false;
  page = 1;
  pageSize = 10;
  total = 0;
  lang!: WallpaperLang;
  mode!: ListMode;
  langValue!: WallpaperLang | 'all';
  modeValue!: ListMode;
  wallpapers: Wallpaper[] = [];

  protected readonly WallpaperLang = WallpaperLang;
  protected readonly ListMode = ListMode;

  protected pageIndex = 'wallpaper';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private lastParam = '';
  private year = '';
  private month = '';

  get paginationUrl() {
    if (this.year) {
      return `/wallpaper/archive/${this.year}${this.month ? '/' + this.month : ''}`;
    }

    return '/wallpaper';
  }

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
        const { queryParamMap: qp, paramMap: p } = this.route.snapshot;

        this.appInfo = appInfo;
        this.options = options;

        this.pageSize = Number(this.options['wallpaper_page_size']) || 10;
        this.page = Number(qp.get('page')) || 1;
        this.lang = <WallpaperLang>qp.get('lang')?.trim();
        this.mode = <ListMode>qp.get('mode')?.trim();
        this.langValue = this.lang || 'all';
        this.modeValue = this.mode || ListMode.CARD;

        this.year = p.get('year')?.trim() || '';
        this.month = p.get('month')?.trim() || '';

        const latestParam = JSON.stringify({
          page: this.page,
          lang: this.lang,
          mode: this.mode,
          year: this.year,
          month: this.month
        });
        if (latestParam === this.lastParam) {
          return;
        }
        this.lastParam = latestParam;

        if (this.year) {
          this.pageIndex = 'wallpaper-archive';
        } else {
          this.pageIndex = 'wallpaper';
        }

        this.updatePageIndex();
        this.getWallpapers();
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

  private getWallpapers() {
    const param: WallpaperQueryParam = {
      page: this.page,
      pageSize: this.pageSize
    };
    if (this.lang) {
      param.lang = this.lang;
    }
    if (this.year) {
      param.year = this.year;
      if (this.month) {
        param.month = this.month;
      }
    }

    this.wallpaperService
      .getWallpapers(param)
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
    const siteName = this.appInfo.appName;
    let description = '';
    const titles = ['高清壁纸', siteName];
    const keywords = (this.options['wallpaper_keywords'] || '').split(',');

    if (this.year) {
      const label = `${this.year}年${this.month ? this.month + '月' : ''}`;
      titles.unshift(label);
      description += label;
    }
    if (description) {
      description += '高清壁纸';
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
    description += `${siteName}${this.options['wallpaper_description']}`;

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
    const breadcrumbs = [
      {
        label: '壁纸',
        tooltip: '高清壁纸',
        url: '/wallpaper',
        isHeader: !this.year
      }
    ];
    if (this.year) {
      breadcrumbs.push(
        {
          label: '归档',
          tooltip: '壁纸归档',
          url: '/wallpaper/archive',
          isHeader: false
        },
        {
          label: `${this.year}年`,
          tooltip: `${this.year}年`,
          url: '/wallpaper/archive/' + this.year,
          isHeader: !this.month
        }
      );
      if (this.month) {
        breadcrumbs.push({
          label: `${Number(this.month)}月`,
          tooltip: `${this.year}年${this.month}月`,
          url: `/wallpaper/archive/${this.year}/${this.month}`,
          isHeader: true
        });
      }
    }
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
