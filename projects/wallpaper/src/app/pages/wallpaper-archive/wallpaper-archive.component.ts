import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { TenantAppModel } from 'common/interfaces';
import { CommonService, OptionService, TenantAppService, WallpaperService } from 'common/services';
import { isEmpty } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from 'common/components';

@Component({
  selector: 'app-wallpaper-archive',
  imports: [NgFor, RouterLink, BreadcrumbComponent],
  providers: [DestroyService],
  templateUrl: './wallpaper-archive.component.html',
  styleUrl: './wallpaper-archive.component.less'
})
export class WallpaperArchiveComponent implements OnInit {
  isMobile = false;
  dateList!: ArchiveDataMap;
  yearList: string[] = [];

  protected pageIndex = 'wallpaper-archive';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};

  constructor(
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly wallpaperService: WallpaperService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

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
        this.appInfo = appInfo;
        this.options = options;

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
        const { dateList, yearList } = this.wallpaperService.transformArchives(res);
        this.dateList = dateList;
        this.yearList = yearList;
      });
  }

  private updatePageInfo() {
    const titles = ['归档', '壁纸', this.appInfo.appName];
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description: `${this.appInfo.appName}壁纸归档。${this.options['wallpaper_description']}`,
      keywords: this.options['wallpaper_keywords'],
      author: this.options['site_author']
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
