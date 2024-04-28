import { Component, OnInit } from '@angular/core';
import { isEmpty, uniq } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { PostType } from '../../../config/common.enum';
import { ArchiveDataMap } from '../../../core/common.interface';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { HTMLMetaData } from '../../../core/meta.interface';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { UserAgentService } from '../../../core/user-agent.service';
import { OptionEntity } from '../../../interfaces/option.interface';
import { TenantAppModel } from '../../../interfaces/tenant-app.interface';
import { OptionService } from '../../../services/option.service';
import { TenantAppService } from '../../../services/tenant-app.service';
import { PostService } from '../post.service';

@Component({
  selector: 'app-post-archive',
  templateUrl: './post-archive.component.html',
  styleUrls: [],
  providers: [DestroyService]
})
export class PostArchiveComponent extends PageComponent implements OnInit {
  isMobile = false;
  pageIndex = '';
  archiveDateList!: ArchiveDataMap;
  archiveYearList: string[] = [];

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private breadcrumbs: BreadcrumbEntity[] = [];

  constructor(
    private userAgentService: UserAgentService,
    private destroy$: DestroyService,
    private metaService: MetaService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private tenantAppService: TenantAppService,
    private optionService: OptionService,
    private postService: PostService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updatePageOptions();
    this.updateBreadcrumb();
    this.fetchArchiveData();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo = appInfo;
        this.options = options;
        this.pageIndex = 'postArchive';

        this.updatePageInfo();
        this.updateActivePage();
      });
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }

  protected updatePageOptions(): void {
    this.commonService.updatePageOptions({
      showHeader: true,
      showFooter: true,
      showMobileHeader: true,
      showMobileFooter: true
    });
  }

  private fetchArchiveData() {
    this.postService
      .getPostArchives({
        postType: PostType.POST,
        showCount: true,
        limit: 0
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const { dateList, yearList } = this.postService.transformArchives(res);
        this.archiveDateList = dateList;
        this.archiveYearList = yearList;
      });
  }

  private updatePageInfo() {
    const titles = ['归档', '文章', this.appInfo.appName];
    const keywords: string[] = (this.options['post_keywords'] || '').split(',');
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description: `${this.appInfo.appName}文章归档。${this.appInfo.appDescription}`,
      author: this.options['site_author'],
      keywords: uniq(keywords).join(',')
    };
    this.metaService.updateHTMLMeta(metaData);
  }

  private updateBreadcrumb(): void {
    this.breadcrumbs = [
      {
        label: '文章',
        tooltip: '文章列表',
        url: '/post',
        isHeader: false
      },
      {
        label: '归档',
        tooltip: '文章归档',
        url: '/post/archive',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumb(this.breadcrumbs);
  }
}
