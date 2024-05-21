import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isEmpty } from 'lodash';
import * as QRCode from 'qrcode';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MessageService } from '../../../core/message.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PlatformService } from '../../../core/platform.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { ActionObjectType, ActionType } from '../../../interfaces/log.enum';
import { OptionEntity } from '../../../interfaces/option.interface';
import { TenantAppModel } from '../../../interfaces/tenant-app.interface';
import { LogService } from '../../../services/log.service';
import { OptionService } from '../../../services/option.service';
import { TenantAppService } from '../../../services/tenant-app.service';
import { JdUnionPromotionResponseBody } from '../jd-union.interface';
import { REGEXP_JD_PRODUCT_DETAIL_URL } from '../tool.constant';
import { ShoppingService } from './shopping.service';

@Component({
  selector: 'app-shopping',
  templateUrl: './shopping.component.html',
  styleUrls: ['./shopping.component.less'],
  providers: [DestroyService]
})
export class ShoppingComponent extends PageComponent implements OnInit {
  @ViewChild('promotionQrcode') promotionQrcodeEle!: ElementRef;

  isMobile = false;
  darkMode = false;
  keyword = '';
  promotion: JdUnionPromotionResponseBody = { clickURL: '' };

  protected pageIndex = 'tool';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private breadcrumbs: BreadcrumbEntity[] = [];

  constructor(
    private route: ActivatedRoute,
    private platformService: PlatformService,
    private userAgentService: UserAgentService,
    private destroy$: DestroyService,
    private metaService: MetaService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private tenantAppService: TenantAppService,
    private optionService: OptionService,
    private message: MessageService,
    private shoppingService: ShoppingService,
    private logService: LogService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updateActivePage();
    this.updatePageOptions();
    this.updateBreadcrumb();

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
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((qp) => {
      this.keyword = qp.get('keyword')?.trim() || '';
      if (this.keyword && this.checkKeyword()) {
        this.fetchPromotion();
      }
    });
    this.commonService.darkMode$.pipe(takeUntil(this.destroy$)).subscribe((darkMode) => {
      this.darkMode = darkMode;
    });
  }

  search(e?: SubmitEvent) {
    e?.preventDefault();
    this.keyword = this.keyword.trim();
    if (this.keyword && this.checkKeyword()) {
      this.fetchPromotion();
      this.logService
        .logAction({
          action: ActionType.PROMOTE_JD_UNION,
          objectType: ActionObjectType.ADS,
          goodsURL: this.keyword
        })
        .subscribe();
    }
  }

  reset() {
    this.keyword = '';
    this.promotion = { clickURL: '' };
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

  private fetchPromotion() {
    this.shoppingService
      .getPromotionCommon(this.keyword)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const code = Number(res.code);
        if (code !== 0 && code !== 200) {
          this.message.error(res.message);
        } else {
          this.promotion = res.data || { clickURL: '' };
          this.showPromotionQrcode();
        }
      });
  }

  private showPromotionQrcode() {
    if (this.platformService.isBrowser && (this.promotion.shortURL || this.promotion.clickURL)) {
      QRCode.toCanvas(this.promotion.shortURL || this.promotion.clickURL, {
        width: 200,
        margin: 0
      })
        .then((canvas) => {
          window.setTimeout(() => {
            canvas.removeAttribute('style');
            canvas.style.width = '100%';
            canvas.style.maxWidth = '200px';
            this.promotionQrcodeEle.nativeElement.innerHTML = '';
            this.promotionQrcodeEle.nativeElement.appendChild(canvas);
          }, 0);
        })
        .catch((err) => this.message.error(err));
    }
  }

  private checkKeyword(): boolean {
    this.keyword = this.keyword.trim().split('?')[0].split('#')[0];

    if (!REGEXP_JD_PRODUCT_DETAIL_URL.test(this.keyword) && !/^\d+$/i.test(this.keyword)) {
      this.message.error('输入内容有误，请输入有效的京东商品详情页地址或商品ID');
      return false;
    }
    return true;
  }

  private updatePageInfo() {
    const siteName: string = this.appInfo.appName;
    const titles: string[] = ['电商工具', '百宝箱', siteName];
    const description = `${siteName}${this.options['shopping_description']}`;

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: this.options['shopping_keywords'],
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
        label: '电商工具',
        tooltip: '电商工具',
        url: '/tool/shopping',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumb(this.breadcrumbs);
  }
}
