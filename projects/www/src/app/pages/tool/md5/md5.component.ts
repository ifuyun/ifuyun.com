import { Component, inject, model, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent, MakeMoneyComponent, MD5_PAGE_DESCRIPTION, MD5_PAGE_KEYWORDS } from 'common/components';
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
import { TenantAppVo } from 'common/interfaces';
import { CommonService, OptionService, TenantAppService } from 'common/services';
import { isEmpty, uniq } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { ClipboardModule } from 'ngx-clipboard';
import { BehaviorSubject, combineLatest, debounceTime, skipWhile, takeUntil } from 'rxjs';
import { Md5Service } from '../../../services/md5.service';

@Component({
  selector: 'app-md5',
  imports: [FormsModule, NzInputModule, NzButtonModule, ClipboardModule, BreadcrumbComponent, MakeMoneyComponent],
  providers: [DestroyService],
  templateUrl: './md5.component.html',
  styleUrl: '../tool.less'
})
export class Md5Component implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly message = inject(MessageService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly md5Service = inject(Md5Service);

  readonly maxContentLength = 8000;
  readonly isMobile = this.uaService.isMobile;
  readonly encryptContent = model('');
  readonly encryptResult = model('');

  protected readonly pageIndex = 'tool-md5';

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});
  private readonly contentChange$ = new BehaviorSubject('');

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
        this.appInfo.set(appInfo);
        this.options.set(options);

        this.updatePageInfo();
      });
  }

  encrypt(isUpper = false) {
    if (!this.encryptContent()) {
      return;
    }
    if (this.encryptContent().length > this.maxContentLength) {
      this.message.error(
        `待加密内容最大长度为 ${this.maxContentLength} 字符，当前为 ${this.encryptContent().length} 字符`
      );
      return;
    }
    this.md5Service
      .transform(this.encryptContent())
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.code === ResponseCode.SUCCESS) {
          const result = res.data || '';

          this.encryptResult.set(isUpper ? result.toUpperCase() : result);
        }
      });
  }

  reset() {
    this.encryptContent.set('');
    this.encryptResult.set('');
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
        this.encryptResult.set('');
      });
  }

  private updatePageInfo() {
    const titles = ['MD5 加密', '工具', this.appInfo()!.name];
    const description = `${this.appInfo()!.name} ${MD5_PAGE_DESCRIPTION}`;
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description,
      keywords: uniq(MD5_PAGE_KEYWORDS)
        .filter((item) => !!item)
        .join(','),
      author: this.options()['site_author']
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
        label: 'MD5 加密',
        tooltip: 'MD5 加密',
        url: '/tool/md5',
        domain: 'www',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
