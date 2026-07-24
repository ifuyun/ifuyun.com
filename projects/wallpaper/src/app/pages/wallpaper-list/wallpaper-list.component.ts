import { Component, computed, inject, model, OnInit, signal } from '@angular/core';
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
  UserAgentService
} from 'common/core';
import { ListMode, WallpaperLang } from 'common/enums';
import { TenantAppVo, Wallpaper, WallpaperQueryParam } from 'common/interfaces';
import { CommonService, OptionService, TenantAppService, WallpaperService } from 'common/services';
import { isEmpty, uniq } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-wallpaper-list',
  imports: [
    RouterLink,
    FormsModule,
    NzIconModule,
    NzRadioModule,
    NzButtonModule,
    NzEmptyModule,
    BreadcrumbComponent,
    PaginationComponent,
    WallpaperItemComponent,
    MakeMoneyComponent
  ],
  providers: [DestroyService],
  templateUrl: './wallpaper-list.component.html',
  styleUrls: ['./wallpaper-list.component.less']
})
export class WallpaperListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly wallpaperService = inject(WallpaperService);

  readonly isMobile = this.uaService.isMobile;
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly total = signal(0);
  readonly lang = signal<WallpaperLang | null>(null);
  readonly mode = signal<ListMode | null>(null);
  readonly langValue = model<WallpaperLang | 'all' | null>(null);
  readonly modeValue = model<ListMode | null>(null);
  readonly wallpapers = signal<Wallpaper[]>([]);
  readonly paginationUrl = computed(() => {
    if (this.year()) {
      return `/archive/${this.year()}${this.month() ? '/' + this.month() : ''}`;
    }

    return '/list';
  });
  readonly paginationParams = computed(() => {
    const params: Params = {};
    if (this.lang()) {
      params['lang'] = this.lang();
    }
    if (this.mode()) {
      params['mode'] = this.mode();
    }

    return params;
  });

  protected readonly WallpaperLang = WallpaperLang;
  protected readonly ListMode = ListMode;
  protected readonly pageIndex = signal('wallpaper-list');

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});
  private readonly lastParam = signal('');
  private readonly year = signal('');
  private readonly month = signal('');

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

        this.appInfo.set(appInfo);
        this.options.set(options);

        this.pageSize.set(Number(options['wallpaper_page_size']) || 10);
        this.page.set(Number(qp.get('page')) || 1);
        this.lang.set(<WallpaperLang>qp.get('lang')?.trim());
        this.mode.set(<ListMode>qp.get('mode')?.trim());
        this.langValue.set(this.lang() || 'all');
        this.modeValue.set(this.mode() || ListMode.CARD);

        this.year.set(p.get('year')?.trim() || '');
        this.month.set(p.get('month')?.trim() || '');

        const latestParam = JSON.stringify({
          page: this.page(),
          lang: this.lang(),
          mode: this.mode(),
          year: this.year(),
          month: this.month()
        });
        if (latestParam === this.lastParam()) {
          return;
        }
        this.lastParam.set(latestParam);

        if (this.year()) {
          this.pageIndex.set('wallpaper-archive');
        } else {
          this.pageIndex.set('wallpaper-list');
        }

        this.updatePageIndex();
        this.getWallpapers();
      });
  }

  getListParam(lang: WallpaperLang | null, mode: ListMode | null, page?: number) {
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
    this.commonService.updatePageIndex(this.pageIndex());
  }

  private getWallpapers() {
    const param: WallpaperQueryParam = {
      page: this.page(),
      size: this.pageSize()
    };
    if (this.lang()) {
      param.lang = <WallpaperLang>this.lang();
    }
    if (this.year()) {
      param.year = this.year();
      if (this.month()) {
        param.month = this.month();
      }
    }

    this.wallpaperService
      .getWallpapers(param)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.page.set(res.page || 1);
        this.total.set(res.total || 0);

        const isEn = this.lang() === WallpaperLang.EN;
        this.wallpapers.set(
          (res.list || []).map((item) => {
            return {
              ...item,
              copyright: isEn ? item.copyrightEn : item.copyright,
              location: isEn ? item.locationEn : item.location,
              story: isEn ? item.storyEn : item.story
            };
          })
        );

        this.updatePageInfo();
        this.updateBreadcrumbs();
      });
  }

  private updatePageInfo() {
    let description = '';
    const titles = ['高清壁纸', this.appInfo()?.name];
    const keywords = (this.options()['wallpaper_keywords'] || '').split(',');

    if (this.year()) {
      const label = `${this.year()}年${this.month() ? this.month() + '月' : ''}`;
      titles.unshift(label);
      description += label;
    }
    if (description) {
      description += '高清壁纸';
    }
    if (this.page() > 1) {
      titles.unshift(`第${this.page()}页`);
      if (description) {
        description += `(第${this.page()}页)`;
      }
    }
    if (description) {
      description += '。';
    }
    description += this.options()['wallpaper_description'];

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords)
        .filter((item) => !!item)
        .join(','),
      author: this.options()['site_author']
    });
  }

  protected updateBreadcrumbs(): void {
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '壁纸',
        tooltip: '高清壁纸',
        url: '/',
        domain: 'wallpaper',
        isHeader: !this.year()
      }
    ];
    if (this.year()) {
      breadcrumbs.push(
        {
          label: '归档',
          tooltip: '壁纸归档',
          url: '/archive',
          domain: 'wallpaper',
          isHeader: false
        },
        {
          label: `${this.year()}年`,
          tooltip: `${this.year()}年`,
          url: '/archive/' + this.year(),
          domain: 'wallpaper',
          isHeader: !this.month()
        }
      );
      if (this.month()) {
        breadcrumbs.push({
          label: `${Number(this.month())}月`,
          tooltip: `${this.year()}年${this.month()}月`,
          url: `/archive/${this.year()}/${this.month()}`,
          domain: 'wallpaper',
          isHeader: true
        });
      }
    }
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
