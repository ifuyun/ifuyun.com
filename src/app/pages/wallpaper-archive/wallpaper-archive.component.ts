import { NgForOf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { ArchiveDataMap } from '../../interfaces/common';
import { HTMLMetaData } from '../../interfaces/meta';
import { OptionEntity } from '../../interfaces/option';
import { TenantAppModel } from '../../interfaces/tenant-app';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { CommonService } from '../../services/common.service';
import { DestroyService } from '../../services/destroy.service';
import { MetaService } from '../../services/meta.service';
import { OptionService } from '../../services/option.service';
import { TenantAppService } from '../../services/tenant-app.service';
import { UserAgentService } from '../../services/user-agent.service';
import { WallpaperService } from '../../services/wallpaper.service';

@Component({
  selector: 'app-wallpaper-archive',
  imports: [NgForOf, RouterLink, BreadcrumbComponent],
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
    this.updateBreadcrumb();
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
      description: `${this.appInfo.appName}壁纸归档。${this.appInfo.appDescription}`,
      keywords: this.options['wallpaper_keywords'],
      author: this.options['site_author']
    };
    this.metaService.updateHTMLMeta(metaData);
  }

  private updateBreadcrumb(): void {
    const breadcrumbs = [
      {
        label: `壁纸`,
        tooltip: `高清壁纸`,
        url: '/wallpaper',
        isHeader: false
      },
      {
        label: '归档',
        tooltip: '壁纸归档',
        url: '/wallpaper/archive',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
