import { Component, OnInit } from '@angular/core';
import { isEmpty, uniq } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { ArchiveDataMap } from '../../../core/common.interface';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { HTMLMetaData } from '../../../core/meta.interface';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { UserAgentService } from '../../../core/user-agent.service';
import { OptionEntity } from '../../../interfaces/option.interface';
import { OptionService } from '../../../services/option.service';
import { PostService } from '../post.service';

@Component({
  selector: 'app-post-archive',
  templateUrl: './post-archive.component.html',
  styleUrls: [],
  providers: [DestroyService]
})
export class PostArchiveComponent extends PageComponent implements OnInit {
  isMobile = false;
  pageIndex = 'postArchive';
  archiveDateList!: ArchiveDataMap;
  archiveYearList: string[] = [];

  private options: OptionEntity = {};
  private breadcrumbs: BreadcrumbEntity[] = [];

  constructor(
    private userAgentService: UserAgentService,
    private destroy$: DestroyService,
    private metaService: MetaService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private optionService: OptionService,
    private postService: PostService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updateActivePage();
    this.updatePageOptions();
    this.updateBreadcrumb();
    this.optionService.options$
      .pipe(
        takeUntil(this.destroy$),
        skipWhile((options) => isEmpty(options))
      )
      .subscribe((options) => {
        this.options = options;
        this.updatePageInfo();
      });
    this.fetchArchiveData();
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
    const titles = ['归档', '文章', this.options['site_name']];
    const keywords: string[] = (this.options['site_keywords'] || '').split(',');
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description: `${this.options['site_name']}文章归档。${this.options['site_description']}`,
      author: this.options['site_author'],
      keywords: uniq(keywords).join(',')
    };
    this.metaService.updateHTMLMeta(metaData);
  }

  private updateBreadcrumb(): void {
    this.breadcrumbs = [
      {
        label: `文章`,
        tooltip: `文章列表`,
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
