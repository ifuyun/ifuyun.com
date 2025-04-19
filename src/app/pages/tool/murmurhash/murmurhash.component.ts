import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isEmpty, uniq } from 'lodash';
import murmurhash from 'murmurhash';
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
import { MURMURHASH_PAGE_DESCRIPTION, MURMURHASH_PAGE_KEYWORDS } from '../tool.constant';

@Component({
  selector: 'app-murmurhash',
  imports: [FormsModule, NzInputModule, NzButtonModule, ClipboardModule, BreadcrumbComponent, MakeMoneyComponent],
  providers: [DestroyService],
  templateUrl: './murmurhash.component.html',
  styleUrl: '../tool.less'
})
export class MurmurhashComponent implements OnInit {
  readonly maxHashKeyLength = 2000;
  readonly maxHashSeedLength = 10;

  isMobile = false;
  hashKey = '';
  hashSeed = '';
  hashResult = '';

  protected pageIndex = 'tool-murmurhash';

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

  hash() {
    if (!this.hashKey) {
      return;
    }
    if (this.hashKey.length > this.maxHashKeyLength) {
      this.message.error(`MurmurHash Key 最大长度为 ${this.maxHashKeyLength} 字符，当前为 ${this.hashKey.length} 字符`);
      return;
    }
    const hashSeed = this.hashSeed.trim();
    if (hashSeed && !/^[1-9]\d*$/i.test(hashSeed)) {
      this.message.error('MurmurHash Seed 应为正整数');
      return;
    }
    if (hashSeed.length > this.maxHashSeedLength) {
      this.message.error(`MurmurHash Seed 最大长度为 ${this.maxHashSeedLength} 字符，当前为 ${hashSeed.length} 字符`);
      return;
    }

    const result = murmurhash(this.hashKey, hashSeed ? Number(hashSeed) : undefined);
    this.hashResult = result.toString();
  }

  reset() {
    this.hashKey = '';
    this.hashSeed = '';
    this.hashResult = '';
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
        this.hashResult = '';
      });
  }

  private updatePageInfo() {
    const titles = ['MurmurHash', '工具', this.appInfo.appName];
    const description = `${this.appInfo.appName} ${MURMURHASH_PAGE_DESCRIPTION}`;
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description,
      keywords: uniq(MURMURHASH_PAGE_KEYWORDS)
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
        label: 'MurmurHash',
        tooltip: 'MurmurHash',
        url: '/tool/murmurhash',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
