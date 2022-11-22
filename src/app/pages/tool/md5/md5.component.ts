import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { BehaviorSubject, Observable, skipWhile, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { MessageService } from '../../../components/message/message.service';
import { CommonService } from '../../../core/common.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { UserAgentService } from '../../../core/user-agent.service';
import md5 from '../../../helpers/md5';
import { OptionEntity } from '../../../interfaces/option.interface';
import { OptionService } from '../../../services/option.service';
import { MD5_PAGE_DESCRIPTION, MD5_PAGE_KEYWORDS } from '../tool.constant';

@Component({
  selector: 'app-md5',
  templateUrl: './md5.component.html',
  styleUrls: ['./md5.component.less']
})
export class Md5Component extends PageComponent implements OnInit, OnDestroy {
  readonly maxContentLength = 8000;

  isMobile = false;
  options: OptionEntity = {};
  encryptContent = '';
  encryptResult = '';
  contentChange$ = new BehaviorSubject('');

  protected pageIndex = 'tool';

  private breadcrumbs: BreadcrumbEntity[] = [];
  private optionsListener!: Subscription;
  private inputListener!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private optionService: OptionService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private metaService: MetaService,
    private userAgentService: UserAgentService,
    private message: MessageService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updateActivePage();
    this.updatePageOptions();
    this.updateBreadcrumb();
    this.optionsListener = this.optionService.options$
      .pipe(skipWhile((options) => isEmpty(options)))
      .subscribe((options) => {
        this.options = options;
        this.updatePageInfo();
      });
    this.initInput();
  }

  ngOnDestroy(): void {
    this.optionsListener.unsubscribe();
    this.inputListener?.unsubscribe();
  }

  onContentChange(content: string) {
    this.contentChange$.next(content);
  }

  encrypt(isUpper = false) {
    if (!this.encryptContent) {
      return;
    }
    if (this.encryptContent.length > this.maxContentLength) {
      this.message.error(`待加密内容最大长度为${this.maxContentLength}字符，当前为${this.encryptContent.length}字符`);
      return;
    }
    const result = md5(this.encryptContent);
    this.encryptResult = isUpper ? result.toUpperCase() : result;
  }

  reset() {
    this.encryptContent = '';
    this.encryptResult = '';
  }

  onCopied() {
    this.message.success('已复制');
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
  private initInput() {
    const contentInput$: Observable<string> = this.contentChange$.asObservable().pipe(debounceTime(500));
    this.inputListener = contentInput$.subscribe(() => {
      this.encryptResult = '';
    });
  }

  private updatePageInfo() {
    const siteName: string = this.options['site_name'] || '';
    const titles: string[] = ['MD5加密', siteName];
    const description = `${siteName}${MD5_PAGE_DESCRIPTION}`;
    const keywords: string[] = (this.options['site_keywords'] || '').split(',');
    keywords.unshift(...MD5_PAGE_KEYWORDS);

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords).join(','),
      author: this.options['site_author']
    });
  }

  private updateBreadcrumb(): void {
    this.breadcrumbs = [
      {
        label: '百宝箱',
        tooltip: '实用工具',
        url: '/tool',
        isHeader: false
      },
      {
        label: 'MD5加密',
        tooltip: 'MD5加密',
        url: '/tool/md5',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateCrumb(this.breadcrumbs);
  }
}
