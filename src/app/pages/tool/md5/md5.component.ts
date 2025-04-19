import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isEmpty, uniq } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { ClipboardModule } from 'ngx-clipboard';
import { BehaviorSubject, combineLatest, debounceTime, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';
import { MakeMoneyComponent } from '../../../components/make-money/make-money.component';
import { HTMLMetaData } from '../../../interfaces/meta';
import { OptionEntity } from '../../../interfaces/option';
import { TenantAppModel } from '../../../interfaces/tenant-app';
import { BreadcrumbService } from '../../../services/breadcrumb.service';
import { CommonService } from '../../../services/common.service';
import { DestroyService } from '../../../services/destroy.service';
import { MessageService } from '../../../services/message.service';
import { MetaService } from '../../../services/meta.service';
import { OptionService } from '../../../services/option.service';
import { TenantAppService } from '../../../services/tenant-app.service';
import { UserAgentService } from '../../../services/user-agent.service';
import md5 from '../../../utils/md5';
import { MD5_PAGE_DESCRIPTION, MD5_PAGE_KEYWORDS } from '../tool.constant';

@Component({
  selector: 'app-md5',
  imports: [FormsModule, NzInputModule, NzButtonModule, ClipboardModule, BreadcrumbComponent, MakeMoneyComponent],
  providers: [DestroyService],
  templateUrl: './md5.component.html',
  styleUrl: '../tool.less'
})
export class Md5Component implements OnInit {
  readonly maxContentLength = 8000;

  isMobile = false;
  encryptContent = '';
  encryptResult = '';

  protected pageIndex = 'tool-md5';

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
    private readonly optionService: OptionService
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

  encrypt(isUpper = false) {
    if (!this.encryptContent) {
      return;
    }
    if (this.encryptContent.length > this.maxContentLength) {
      this.message.error(
        `待加密内容最大长度为 ${this.maxContentLength} 字符，当前为 ${this.encryptContent.length} 字符`
      );
      return;
    }
    const result = md5(this.encryptContent);
    this.encryptResult = isUpper ? result.toUpperCase() : result;
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
    const titles = ['MD5 加密', '工具', this.appInfo.appName];
    const description = `${this.appInfo.appName} ${MD5_PAGE_DESCRIPTION}`;
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description,
      keywords: uniq(MD5_PAGE_KEYWORDS)
        .filter((item) => !!item)
        .join(','),
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
        label: 'MD5 加密',
        tooltip: 'MD5 加密',
        url: '/tool/md5',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
