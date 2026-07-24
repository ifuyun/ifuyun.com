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
import { CommonService, OptionService, PostService, TenantAppService } from 'common/services';
import { isEmpty } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-post-archive',
  imports: [RouterLink, BreadcrumbComponent],
  providers: [DestroyService],
  templateUrl: './post-archive.component.html',
  styleUrl: './post-archive.component.less'
})
export class PostArchiveComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly postService = inject(PostService);

  readonly isMobile = this.uaService.isMobile;
  readonly dateList = signal<ArchiveDataMap>({});
  readonly yearList = signal<string[]>([]);

  protected readonly pageIndex = 'post-archive';

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});

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
        this.appInfo.set(appInfo);
        this.options.set(options);

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
        const { dateList, yearList } = this.commonService.buildArchiveList(res);
        this.dateList.set(dateList);
        this.yearList.set(yearList);
      });
  }

  private updatePageInfo() {
    const titles = ['归档', '博客', this.appInfo()!.name];
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description: `${this.appInfo()!.name}博客归档。${this.options()['post_description']}`,
      keywords: this.options()['post_keywords'],
      author: this.options()['site_author']
    };
    this.metaService.updateHTMLMeta(metaData);
  }

  private updateBreadcrumbs(): void {
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '博客',
        tooltip: `博客`,
        url: '/',
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
