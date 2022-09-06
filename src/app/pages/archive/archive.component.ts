import { ViewportScroller } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { isEmpty, uniq } from 'lodash';
import { skipWhile, Subscription } from 'rxjs';
import { BreadcrumbEntity } from '../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../components/breadcrumb/breadcrumb.service';
import { PageComponent } from '../../core/page.component';
import { CommonService } from '../../core/common.service';
import { UserAgentService } from '../../core/user-agent.service';
import { HTMLMetaData } from '../../interfaces/meta';
import { OptionEntity } from '../../interfaces/options';
import { PostArchiveDateMap } from '../../interfaces/posts';
import { MetaService } from '../../core/meta.service';
import { OptionsService } from '../../services/options.service';
import { PostsService } from '../../services/posts.service';

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
    private optionsService: OptionsService,
    private metaService: MetaService,
    private postsService: PostsService,
    private crumbService: BreadcrumbService,
    private commonService: CommonService,
    private userAgentService: UserAgentService,
    private scroller: ViewportScroller
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.optionsListener = this.optionsService.options$
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
    this.crumbService.updateCrumb(breadcrumbs);
    this.archiveListener = this.postsService
      .getPostArchives({
        showCount: true,
        limit: 0
      })
      .subscribe((res) => {
        const { dateList, yearList } = this.postsService.transformArchiveDates(res);
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
