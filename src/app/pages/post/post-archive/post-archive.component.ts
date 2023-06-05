import { Component, Input, OnInit } from '@angular/core';
import { isEmpty, uniq } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
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
import { OptionService } from '../../../services/option.service';
import { PostService } from '../post.service';

@Component({
  selector: 'app-post-archive',
  templateUrl: './post-archive.component.html',
  styleUrls: [],
  providers: [DestroyService]
})
export class PostArchiveComponent extends PageComponent implements OnInit {
  @Input() postType: PostType = PostType.POST;

  isPrompt = false;
  isPost = false;
  isMobile = false;
  pageIndex = '';
  urlPrefix = '';
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
    this.isPrompt = this.postType === PostType.PROMPT;
    this.isPost = this.postType === PostType.POST;
    this.urlPrefix = this.isPrompt ? 'prompt' : 'post';

    this.updatePageOptions();
    this.updateBreadcrumb();
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        this.options = options;
        this.updatePageInfo();

        this.pageIndex = this.isPrompt ? 'promptArchive' : 'postArchive';
        this.updateActivePage();
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
        postType: this.isPrompt ? PostType.PROMPT : PostType.POST,
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
    const pageType = this.isPost ? '文章' : 'Prompt';
    const titles = ['归档', pageType, this.options['site_name']];
    const pageKeywords = this.isPost ? this.options['post_keywords'] : this.options['prompt_keywords'];
    const keywords: string[] = (pageKeywords || '').split(',');
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description: `${this.options['site_name']}${pageType}归档。${this.options['site_description']}`,
      author: this.options['site_author'],
      keywords: uniq(keywords).join(',')
    };
    this.metaService.updateHTMLMeta(metaData);
  }

  private updateBreadcrumb(): void {
    const pageType = this.isPost ? '文章' : 'Prompt';
    this.breadcrumbs = [
      {
        label: pageType,
        tooltip: `${pageType}列表`,
        url: `/${this.urlPrefix}`,
        isHeader: false
      },
      {
        label: '归档',
        tooltip: `${pageType}归档`,
        url: `/${this.urlPrefix}/archive`,
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumb(this.breadcrumbs);
  }
}
