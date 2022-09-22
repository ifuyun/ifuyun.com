import { ViewportScroller } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { isEmpty, uniq } from 'lodash';
import { skipWhile, Subscription } from 'rxjs';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { PageComponent } from '../../../core/page.component';
import { CommonService } from '../../../core/common.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { HTMLMetaData } from '../../../core/meta.interface';
import { OptionEntity } from '../../../interfaces/option.interface';
import { PostArchiveDateMap } from '../post.interface';
import { MetaService } from '../../../core/meta.service';
import { OptionService } from '../../../services/option.service';
import { PostService } from '../post.service';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.less']
})
export class ArchiveComponent extends PageComponent implements OnInit, OnDestroy {
  isMobile = false;
  pageIndex = 'archive';
  archiveDateList!: PostArchiveDateMap;
  archiveYearList: string[] = [];
  showCrumb = true;

  private options: OptionEntity = {};
  private optionsListener!: Subscription;
  private archiveListener!: Subscription;

  constructor(
    private optionService: OptionService,
    private metaService: MetaService,
    private postService: PostService,
    private breadcrumbService: BreadcrumbService,
    private commonService: CommonService,
    private userAgentService: UserAgentService,
    private scroller: ViewportScroller
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.optionsListener = this.optionService.options$
      .pipe(skipWhile((options) => isEmpty(options)))
      .subscribe((options) => {
        this.options = options;
        const titles = ['文章归档', this.options['site_name']];
        const keywords: string[] = (this.options['site_keywords'] || '').split(',');
        const metaData: HTMLMetaData = {
          title: titles.join(' - '),
          description: `${this.options['site_name']}文章归档。${this.options['site_description']}`,
          author: this.options['site_author'],
          keywords: uniq(keywords).join(',')
        };
        this.metaService.updateHTMLMeta(metaData);
      });
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '文章归档',
        tooltip: '文章归档',
        url: '/archive',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateCrumb(breadcrumbs);
    this.archiveListener = this.postService
      .getPostArchives({
        showCount: true,
        limit: 0
      })
      .subscribe((res) => {
        const { dateList, yearList } = this.postService.transformArchiveDates(res);
        this.archiveDateList = dateList;
        this.archiveYearList = yearList;
        this.updateActivePage();
      });
    this.scroller.scrollToPosition([0, 0]);
  }

  ngOnDestroy() {
    this.optionsListener.unsubscribe();
    this.archiveListener.unsubscribe();
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }
}
