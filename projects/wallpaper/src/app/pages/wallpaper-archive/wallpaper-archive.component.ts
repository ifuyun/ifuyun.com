import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbComponent } from 'common/components';
import {
  ArchiveDataMap,
  BreadcrumbEntity,
  BreadcrumbService,
  DestroyService,
  HTMLMetaData,
  MetaService,
  OptionEntity,
  UserAgentService
} from 'common/core';
import { TenantAppVo } from 'common/interfaces';
import { CommonService, OptionService, TenantAppService, WallpaperService } from 'common/services';
import { isEmpty } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-wallpaper-archive',
  imports: [RouterLink, BreadcrumbComponent],
  providers: [DestroyService],
  templateUrl: './wallpaper-archive.component.html',
  styleUrl: './wallpaper-archive.component.less'
})
export class WallpaperArchiveComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly wallpaperService = inject(WallpaperService);

  readonly isMobile = this.uaService.isMobile;
  readonly dateList = signal<ArchiveDataMap>({});
  readonly yearList = signal<string[]>([]);

  protected readonly pageIndex = 'wallpaper-archive';

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumbs();
    this.getWallpaperArchives();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo.set(appInfo);
        this.options.set(options);

        this.updatePageInfo();
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getWallpaperArchives() {
    this.wallpaperService
      .getWallpaperArchives(true, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const { dateList, yearList } = this.commonService.buildArchiveList(res);
        this.dateList.set(dateList);
        this.yearList.set(yearList);
      });
  }

  private updatePageInfo() {
    const titles = ['归档', '壁纸', this.appInfo()!.name];
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description: `${this.appInfo()!.name}壁纸归档。${this.options()['wallpaper_description']}`,
      keywords: this.options()['wallpaper_keywords'],
      author: this.options()['site_author']
    };
    this.metaService.updateHTMLMeta(metaData);
  }

  private updateBreadcrumbs(): void {
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: `壁纸`,
        tooltip: `高清壁纸`,
        url: '/',
        domain: 'wallpaper',
        isHeader: false
      },
      {
        label: '归档',
        tooltip: '壁纸归档',
        url: '/archive',
        domain: 'wallpaper',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
