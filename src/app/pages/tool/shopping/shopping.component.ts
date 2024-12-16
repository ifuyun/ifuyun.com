import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzQRCodeModule } from 'ng-zorro-antd/qr-code';
import { BehaviorSubject, combineLatest, debounceTime, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';
import { JdUnionPromotionResponseBody } from '../../../interfaces/jd-union';
import { HTMLMetaData } from '../../../interfaces/meta';
import { OptionEntity } from '../../../interfaces/option';
import { TenantAppModel } from '../../../interfaces/tenant-app';
import { BreadcrumbService } from '../../../services/breadcrumb.service';
import { CommonService } from '../../../services/common.service';
import { DestroyService } from '../../../services/destroy.service';
import { MessageService } from '../../../services/message.service';
import { MetaService } from '../../../services/meta.service';
import { OptionService } from '../../../services/option.service';
import { ShoppingService } from '../../../services/shopping.service';
import { TenantAppService } from '../../../services/tenant-app.service';
import { UserAgentService } from '../../../services/user-agent.service';
import { REGEXP_JD_PRODUCT_DETAIL_URL } from '../tool.constant';

@Component({
  selector: 'app-shopping',
  imports: [
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzQRCodeModule,
    NzEmptyModule,
    BreadcrumbComponent
  ],
  providers: [DestroyService],
  templateUrl: './shopping.component.html',
  styleUrls: ['../tool.less', './shopping.component.less']
})
export class ShoppingComponent implements OnInit {
  isMobile = false;
  keyword = '';
  jdResult: JdUnionPromotionResponseBody | null = null;

  protected pageIndex = 'tool-shopping';

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
    private readonly shoppingService: ShoppingService
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

  query() {
    if (!this.keyword.trim()) {
      return;
    }
    if (!this.checkKeyword()) {
      this.message.error('输入内容有误，请输入有效的京东商品详情页地址或商品ID');
      return;
    }
    this.shoppingService
      .getPromotionCommon(this.keyword)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const code = Number(res.code);
        if (code !== 0 && code !== 200) {
          this.message.error(res.message);
        } else {
          this.jdResult = res.data || { clickURL: '' };
        }
      });
  }

  reset() {
    this.keyword = '';
    this.jdResult = null;
  }

  onContentChange(content: string) {
    this.contentChange$.next(content);
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private checkKeyword(): boolean {
    this.keyword = this.keyword.trim().split('?')[0].split('#')[0];

    return REGEXP_JD_PRODUCT_DETAIL_URL.test(this.keyword) || /^\d+$/i.test(this.keyword);
  }

  private initInput() {
    this.contentChange$
      .asObservable()
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(() => {
        this.jdResult = null;
      });
  }

  private updatePageInfo() {
    const titles = ['电商工具', '实用工具', this.appInfo.appName];
    const description = `${this.appInfo.appName}${this.options['shopping_description']}`;
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description,
      keywords: this.options['shopping_keywords'],
      author: this.options['site_author']
    };
    this.metaService.updateHTMLMeta(metaData);
  }

  private updateBreadcrumbs(): void {
    const breadcrumbs = [
      {
        label: '实用工具',
        tooltip: '实用工具',
        url: '/tool',
        isHeader: false
      },
      {
        label: '电商工具',
        tooltip: '电商工具',
        url: '/tool/shopping',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
