import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import * as QRCode from 'qrcode';
import { skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { MessageService } from '../../../components/message/message.service';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PlatformService } from '../../../core/platform.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { OptionEntity } from '../../../interfaces/option.interface';
import { OptionService } from '../../../services/option.service';
import { JdUnionResponsePromotion } from '../jd-union.interface';
import { REGEXP_JD_PRODUCT_DETAIL_URL, SHOPPING_PAGE_DESCRIPTION, SHOPPING_PAGE_KEYWORDS } from '../tool.constant';
import { ShoppingService } from './shopping.service';

@Component({
  selector: 'app-shopping',
  templateUrl: './shopping.component.html',
  styleUrls: ['./shopping.component.less'],
  providers: [DestroyService]
})
export class ShoppingComponent extends PageComponent implements OnInit {
  @ViewChild('promotionQrcode') promotionQrcode!: ElementRef;

  isMobile = false;
  keyword = '';
  promotion!: JdUnionResponsePromotion;

  protected pageIndex = 'tool';

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
    private optionService: OptionService,
    private message: MessageService,
    private shoppingService: ShoppingService
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
        takeUntil(this.destroy$),
        skipWhile((options) => isEmpty(options))
      )
      .subscribe((options) => {
        this.options = options;
        this.updatePageInfo();
      });
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((queryParams) => {
      this.keyword = queryParams.get('keyword')?.trim() || '';
      if (this.keyword && this.checkKeyword()) {
        this.fetchPromotion();
      }
    });
  }

  search(e: SubmitEvent) {
    e.preventDefault();
    this.keyword = this.keyword.trim();
    if (this.keyword && this.checkKeyword()) {
      this.fetchPromotion();
    }
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
          this.promotion = res;
          this.showPromotionQrcode();
        }
      });
  }

  private showPromotionQrcode() {
    if (this.platformService.isBrowser && (this.promotion.data.shortURL || this.promotion.data.clickURL)) {
      QRCode.toCanvas(this.promotion.data.shortURL || this.promotion.data.clickURL, {
        width: 200,
        margin: 0
      })
        .then((canvas) => {
          setTimeout(() => {
            canvas.removeAttribute('style');
            canvas.style.width = '100%';
            canvas.style.maxWidth = '200px';
            this.promotionQrcode.nativeElement.innerHTML = '';
            this.promotionQrcode.nativeElement.appendChild(canvas);
          }, 0);
        })
        .catch((err) => this.message.error(err));
    }
  }

  private checkKeyword(): boolean {
    this.keyword = this.keyword.trim().split('?')[0].split('#')[0];

    if (!REGEXP_JD_PRODUCT_DETAIL_URL.test(this.keyword) && !/^\d+$/i.test(this.keyword)) {
      this.message.error('输入内容有误，请重新输入有效的京东商品详情页地址或商品ID');
      return false;
    }
    return true;
  }

  private updatePageInfo() {
    const siteName: string = this.options['site_name'] || '';
    const titles: string[] = ['电商优惠券', siteName];
    const description = `${siteName}${SHOPPING_PAGE_DESCRIPTION}`;
    const keywords: string[] = (this.options['site_keywords'] || '').split(',');
    keywords.unshift(...SHOPPING_PAGE_KEYWORDS);

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
        label: '电商优惠券',
        tooltip: '电商优惠券',
        url: '/tool/shopping',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumb(this.breadcrumbs);
  }
}
