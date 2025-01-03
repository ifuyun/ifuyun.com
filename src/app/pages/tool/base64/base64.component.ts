import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isEmpty, uniq } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { ClipboardModule } from 'ngx-clipboard';
import { BehaviorSubject, combineLatest, debounceTime, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';
import { MakeMoneyComponent } from '../../../components/make-money/make-money.component';
import { ResponseCode } from '../../../config/response-code.enum';
import { HTMLMetaData } from '../../../interfaces/meta';
import { OptionEntity } from '../../../interfaces/option';
import { TenantAppModel } from '../../../interfaces/tenant-app';
import { Base64Service } from '../../../services/base64.service';
import { BreadcrumbService } from '../../../services/breadcrumb.service';
import { CommonService } from '../../../services/common.service';
import { DestroyService } from '../../../services/destroy.service';
import { MessageService } from '../../../services/message.service';
import { MetaService } from '../../../services/meta.service';
import { OptionService } from '../../../services/option.service';
import { TenantAppService } from '../../../services/tenant-app.service';
import { UserAgentService } from '../../../services/user-agent.service';
import { BASE64_PAGE_DESCRIPTION, BASE64_PAGE_KEYWORDS } from '../tool.constant';

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
    const keywords: string[] = BASE64_PAGE_KEYWORDS.concat(this.appInfo.keywords);
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords).join(','),
      author: this.options['site_author']
    };
    this.metaService.updateHTMLMeta(metaData);
  }

  private updateBreadcrumbs(): void {
    const breadcrumbs = [
      {
        label: '工具',
        tooltip: '工具',
        url: '/tool',
        isHeader: false
      },
      {
        label: 'Base64 编解码',
        tooltip: 'Base64 编解码',
        url: '/tool/base64',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
