import { Component, inject, OnInit, signal } from '@angular/core';
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
  UserAgentService
} from 'common/core';
import { ListMode, WallpaperLang } from 'common/enums';
import { TenantAppVo, Wallpaper, WallpaperQueryParam } from 'common/interfaces';
import { CommonService, OptionService, TenantAppService, WallpaperService } from 'common/services';
import { isEmpty, uniq } from 'lodash';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-wallpaper-jigsaw-list',
  imports: [
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
  readonly wallpapers = signal<Wallpaper[]>([]);
  readonly paginationUrl = '/list';

  protected readonly WallpaperLang = WallpaperLang;
  protected readonly ListMode = ListMode;
  protected readonly pageIndex = 'jigsaw';

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});
  private readonly lastParam = signal('');

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

        this.appInfo.set(appInfo);
        this.options.set(options);
        this.pageSize.set(Number(this.options()['wallpaper_page_size']) || 10);
        this.page.set(Number(qp.get('page')) || 1);

        const latestParam = JSON.stringify({
          page: this.page()
        });
        if (latestParam === this.lastParam()) {
          return;
        }
        this.lastParam.set(latestParam);

        this.updatePageIndex();
        this.getWallpapers();
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getWallpapers() {
    const param: WallpaperQueryParam = {
      page: this.page(),
      size: this.pageSize(),
      future: 1
    };

    this.wallpaperService
      .getWallpapers(param)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.page.set(res.page || 1);
        this.total.set(res.total || 0);
        this.wallpapers.set(res.list || []);

        this.updatePageInfo();
        this.updateBreadcrumbs();
      });
  }

  private updatePageInfo() {
    let description = '';
    const titles = ['壁纸拼图', this.appInfo()!.name];
    const keywords = (this.options()['jigsaw_keywords'] || '').split(',');

    if (description) {
      description += '壁纸拼图';
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
    description += this.options()['jigsaw_description'];

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
        label: '壁纸拼图',
        tooltip: '壁纸拼图',
        url: '/',
        domain: 'jigsaw',
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
