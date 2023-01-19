import { Component, OnInit } from '@angular/core';
import { isEmpty, uniq } from 'lodash';
import * as murmurhash from 'murmurhash';
import { BehaviorSubject, debounceTime, Observable, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { MessageService } from '../../../components/message/message.service';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { UserAgentService } from '../../../core/user-agent.service';
import { OptionEntity } from '../../../interfaces/option.interface';
import { OptionService } from '../../../services/option.service';
import { MURMURHASH_PAGE_DESCRIPTION, MURMURHASH_PAGE_KEYWORDS } from '../tool.constant';

@Component({
  selector: 'app-murmurhash',
  templateUrl: './murmurhash.component.html',
  styleUrls: ['./murmurhash.component.less'],
  providers: [DestroyService]
})
export class MurmurhashComponent extends PageComponent implements OnInit {
  readonly maxHashKeyLength = 2000;
  readonly maxHashSeedLength = 10;

  isMobile = false;
  options: OptionEntity = {};
  hashKey = '';
  hashSeed = '';
  hashResult = '';

  protected pageIndex = 'tool';

  private breadcrumbs: BreadcrumbEntity[] = [];
  private contentChange$ = new BehaviorSubject('');

  constructor(
    private destroy$: DestroyService,
    private userAgentService: UserAgentService,
    private metaService: MetaService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private optionService: OptionService,
    private message: MessageService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updateActivePage();
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
      });
    this.initInput();
  }

  onContentChange(content: string) {
    this.contentChange$.next(content);
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
    const contentInput$: Observable<string> = this.contentChange$.asObservable();
    contentInput$.pipe(debounceTime(500), takeUntil(this.destroy$)).subscribe(() => {
      this.hashResult = '';
    });
  }

  private updatePageInfo() {
    const siteName: string = this.options['site_name'] || '';
    const titles: string[] = ['MurmurHash', '百宝箱', siteName];
    const description = `${siteName}${MURMURHASH_PAGE_DESCRIPTION}`;
    const keywords: string[] = (this.options['site_keywords'] || '').split(',');
    keywords.unshift(...MURMURHASH_PAGE_KEYWORDS);

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
        label: 'MurmurHash',
        tooltip: 'MurmurHash',
        url: '/tool/murmurhash',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumb(this.breadcrumbs);
  }
}
