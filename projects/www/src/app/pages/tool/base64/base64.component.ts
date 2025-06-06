import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BASE64_PAGE_DESCRIPTION,
  BASE64_PAGE_KEYWORDS,
  BreadcrumbComponent,
  MakeMoneyComponent
} from 'common/components';
import {
  BreadcrumbEntity,
  BreadcrumbService,
  DestroyService,
  HTMLMetaData,
  MessageService,
  MetaService,
  OptionEntity,
  ResponseCode,
  UserAgentService
} from 'common/core';
import { TenantAppModel } from 'common/interfaces';
import { CommonService, OptionService, TenantAppService } from 'common/services';
import { isEmpty, uniq } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { ClipboardModule } from 'ngx-clipboard';
import { BehaviorSubject, combineLatest, debounceTime, skipWhile, takeUntil } from 'rxjs';
import { Base64Service } from '../../../services/base64.service';

@Component({
  selector: 'app-base64',
  imports: [FormsModule, NzInputModule, NzButtonModule, ClipboardModule, BreadcrumbComponent, MakeMoneyComponent],
  providers: [DestroyService],
  templateUrl: './base64.component.html',
  styleUrl: '../tool.less'
})
export class Base64Component implements OnInit {
  readonly maxContentLength = 2000;

  isMobile = false;
  encryptContent = '';
  encryptResult = '';

  protected pageIndex = 'tool-base64';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private contentChange$ = new BehaviorSubject('');

  constructor(
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly message: MessageService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly base64Service: Base64Service
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumbs();
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

  onContentChange(content: string) {
    this.contentChange$.next(content);
  }

  onCopied() {
    this.message.success('已复制');
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
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
    const titles = ['Base64 编解码', '工具', this.appInfo.appName];
    const description = `${this.appInfo.appName} ${BASE64_PAGE_DESCRIPTION}`;
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description,
      keywords: uniq(BASE64_PAGE_KEYWORDS)
        .filter((item) => !!item)
        .join(','),
      author: this.options['site_author']
    };
    this.metaService.updateHTMLMeta(metaData);
  }

  private updateBreadcrumbs(): void {
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '工具',
        tooltip: '工具',
        url: '/tool',
        domain: 'www',
        isHeader: false
      },
      {
        label: 'Base64 编解码',
        tooltip: 'Base64 编解码',
        url: '/tool/base64',
        domain: 'www',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
