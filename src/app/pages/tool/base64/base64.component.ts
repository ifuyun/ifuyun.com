import { Component, OnInit } from '@angular/core';
import { isEmpty, uniq } from 'lodash';
import { BehaviorSubject, combineLatest, debounceTime, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { ResponseCode } from '../../../config/response-code.enum';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MessageService } from '../../../core/message.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { UserAgentService } from '../../../core/user-agent.service';
import { OptionEntity } from '../../../interfaces/option.interface';
import { TenantAppModel } from '../../../interfaces/tenant-app.interface';
import { OptionService } from '../../../services/option.service';
import { TenantAppService } from '../../../services/tenant-app.service';
import { BASE64_PAGE_DESCRIPTION, BASE64_PAGE_KEYWORDS } from '../tool.constant';
import { Base64Service } from './base64.service';

@Component({
  selector: 'app-base64',
  templateUrl: './base64.component.html',
  styleUrls: ['../md5/md5.component.less'],
  providers: [DestroyService]
})
export class Base64Component extends PageComponent implements OnInit {
  readonly maxContentLength = 2000;

  isMobile = false;
  encryptContent = '';
  encryptResult = '';

  protected pageIndex = 'tool';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private breadcrumbs: BreadcrumbEntity[] = [];
  private contentChange$ = new BehaviorSubject('');

  constructor(
    private destroy$: DestroyService,
    private userAgentService: UserAgentService,
    private metaService: MetaService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private tenantAppService: TenantAppService,
    private optionService: OptionService,
    private message: MessageService,
    private base64Service: Base64Service
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updateActivePage();
    this.updatePageOptions();
    this.updateBreadcrumb();
    this.initInput();

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

  onContentChange(content: string) {
    this.contentChange$.next(content);
  }

  transform(action: 'encode' | 'decode') {
    if (!this.encryptContent) {
      return;
    }
    if (this.encryptContent.length > this.maxContentLength) {
      this.message.error(
        `待编解码内容最大长度为 ${this.maxContentLength} 字符，当前为 ${this.encryptContent.length} 字符`
      );
      return;
    }
    this.base64Service
      .transform(this.encryptContent, action)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.code === ResponseCode.SUCCESS) {
          this.encryptResult = res.data || '';
        }
      });
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
    this.contentChange$
      .asObservable()
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(() => {
        this.encryptResult = '';
      });
  }

  private updatePageInfo() {
    const siteName: string = this.appInfo.appName;
    const titles: string[] = ['Base64编解码', '百宝箱', siteName];
    const description = `${siteName}${BASE64_PAGE_DESCRIPTION}`;
    const keywords: string[] = this.appInfo.keywords;

    keywords.unshift(...BASE64_PAGE_KEYWORDS);

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
        label: 'Base64编解码',
        tooltip: 'Base64编解码',
        url: '/tool/base64',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumb(this.breadcrumbs);
  }
}
