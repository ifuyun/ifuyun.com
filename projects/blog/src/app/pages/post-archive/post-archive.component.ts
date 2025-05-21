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
import { CommonService, OptionService, PostService, TenantAppService } from 'common/services';
import { isEmpty } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from 'common/components';

@Component({
  selector: 'app-post-archive',
  imports: [NgFor, RouterLink, BreadcrumbComponent],
  providers: [DestroyService],
  templateUrl: './post-archive.component.html',
  styleUrl: './post-archive.component.less'
})
export class PostArchiveComponent implements OnInit {
  isMobile = false;
  dateList!: ArchiveDataMap;
  yearList: string[] = [];

  protected pageIndex = 'post-archive';

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
    private readonly postService: PostService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumbs();
    this.getPostArchives();

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

  private getPostArchives() {
    this.postService
      .getPostArchives(true, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const { dateList, yearList } = this.postService.transformArchives(res);
        this.dateList = dateList;
        this.yearList = yearList;
      });
  }

  private updatePageInfo() {
    const titles = ['归档', '博客', this.appInfo.appName];
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description: `${this.appInfo.appName}博客归档。${this.appInfo.appDescription}`,
      keywords: this.options['post_keywords'],
      author: this.options['site_author']
    };
    this.metaService.updateHTMLMeta(metaData);
  }

  private updateBreadcrumbs(): void {
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '博客',
        tooltip: `博客文章列表`,
        url: '/list',
        domain: 'blog',
        isHeader: false
      },
      {
        label: '归档',
        tooltip: `博客归档`,
        url: '/archive',
        domain: 'blog',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
