import { NgForOf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, RouterLink } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { WallpaperItemComponent } from '../../components/wallpaper-item/wallpaper-item.component';
import { OptionEntity } from '../../interfaces/option';
import { TenantAppModel } from '../../interfaces/tenant-app';
import { Wallpaper, WallpaperQueryParam } from '../../interfaces/wallpaper';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { CommonService } from '../../services/common.service';
import { DestroyService } from '../../services/destroy.service';
import { MetaService } from '../../services/meta.service';
import { OptionService } from '../../services/option.service';
import { PaginationService } from '../../services/pagination.service';
import { TenantAppService } from '../../services/tenant-app.service';
import { UserAgentService } from '../../services/user-agent.service';
import { WallpaperService } from '../../services/wallpaper.service';
import { WallpaperLang, WallpaperListMode } from '../../enums/wallpaper';

@Component({
  selector: 'app-wallpaper-list',
  imports: [
    NgForOf,
    RouterLink,
    FormsModule,
    NzIconModule,
    NzRadioModule,
    BreadcrumbComponent,
    PaginationComponent,
    WallpaperItemComponent
  ],
  providers: [DestroyService],
  templateUrl: './wallpaper-list.component.html',
  styleUrls: ['./wallpaper-list.component.less', '../post-list/post-list.component.less']
})
export class WallpaperListComponent implements OnInit {
  isMobile = false;
  page = 1;
  pageSize = 10;
  total = 0;
  lang!: WallpaperLang;
  mode!: WallpaperListMode;
  langValue!: WallpaperLang | 'all';
  modeValue!: WallpaperListMode;
  keyword = '';
  wallpapers: Wallpaper[] = [];

  protected readonly WallpaperLang = WallpaperLang;
  protected readonly WallpaperListMode = WallpaperListMode;

  protected activePage = 'wallpaper';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
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
    if (this.keyword) {
      params['keyword'] = this.keyword;
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
      .subscribe(([appInfo, options, p, qp]) => {
        this.appInfo = appInfo;
        this.options = options;

        this.pageSize = Number(this.options['wallpaper_page_size']) || 10;
        this.page = Number(qp.get('page')) || 1;
        this.keyword = qp.get('keyword')?.trim() || '';
        this.lang = <WallpaperLang>qp.get('lang')?.trim();
        this.mode = <WallpaperListMode>qp.get('mode')?.trim();
        this.langValue = this.lang || 'all';
        this.modeValue = this.mode || WallpaperListMode.CARD;

        this.year = p.get('year')?.trim() || '';
        this.month = p.get('month')?.trim() || '';

        if (this.year) {
          this.activePage = 'wallpaperArchive';
        } else {
          this.activePage = 'wallpaper';
        }

        this.updateActivePage();
        this.getWallpapers();
      });
  }

  getListParam(lang: WallpaperLang | null, mode: WallpaperListMode, page?: number) {
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

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.activePage);
  }

  private getWallpapers() {
    const param: WallpaperQueryParam = {
      page: this.page,
      pageSize: this.pageSize
    };
    if (this.lang) {
      param.lang = this.lang;
    }
    if (this.keyword) {
      param.keyword = this.keyword;
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
        this.updateBreadcrumb();
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
    if (this.keyword) {
      titles.unshift(this.keyword, '搜索');
      description += `「${this.keyword}」高清壁纸搜索结果`;
      keywords.unshift(this.keyword);
    } else {
      if (description) {
        description += '高清壁纸';
      }
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
      keywords: uniq(keywords).join(','),
      author: this.options['site_author']
    });
  }

  protected updateBreadcrumb(): void {
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
