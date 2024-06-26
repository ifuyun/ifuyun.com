import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { combineLatestWith, of, skipWhile, takeUntil } from 'rxjs';
import { environment as env } from '../../../environments/environment';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { UrlService } from '../../core/url.service';
import { UserAgentService } from '../../core/user-agent.service';
import { ActionObjectType, ActionType } from '../../interfaces/log.enum';
import { OptionEntity } from '../../interfaces/option.interface';
import { JdUnionGoodsJingfen, JdUnionGoodsMaterial } from '../../pages/tool/jd-union.interface';
import { ShoppingService } from '../../pages/tool/shopping/shopping.service';
import { NumberViewPipe } from '../../pipes/number-view.pipe';
import { LogService } from '../../services/log.service';
import { OptionService } from '../../services/option.service';
import { EmptyComponent } from '../empty/empty.component';
import { JdUnionOptions } from './jd-union-goods.interface';

@Component({
  selector: 'i-jd-union-goods',
  templateUrl: './jd-union-goods.component.html',
  styleUrls: ['./jd-union-goods.component.less'],
  standalone: true,
  imports: [CommonModule, EmptyComponent, DecimalPipe, NumberViewPipe],
  providers: [DestroyService]
})
export class JdUnionGoodsComponent implements OnInit {
  @Input() eliteIds: number | number[] = 2;
  @Input() page = 1;
  @Input() pageSize = 3;
  @Input() rowSize = 3;
  @Input() showHeader = true;
  @Input() isJingfen = false;
  @Input() isRandom = false;
  @Input() showBorder = true;
  @Input() showComments = true;
  @Input() withBox = true;
  @Input() visible = true;
  @Input() dynamic = false;
  @Input() optionKey = '';
  @Input() forceRefresh = true;
  @Input() showEmptyBackground = true;
  @Input() position = '';

  readonly materialEliteIds = Object.freeze([1, 2, 3, 4]);
  readonly jingfenEliteIds = Object.freeze([
    0, 1, 2, 10, 15, 22, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 40, 41, 108, 109, 110, 112, 125, 129, 130, 153,
    210, 238, 247, 249, 315, 340, 341, 342, 343, 345, 346, 426
  ]);
  // 精选-全球购
  readonly otherEliteIds = Object.freeze([
    536, 538, 539, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560,
    561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577
  ]);

  isMobile = false;
  adsFlag = false;
  eliteId!: number;
  goodsList: (JdUnionGoodsMaterial | JdUnionGoodsJingfen)[] = [];

  private options: OptionEntity = {};

  constructor(
    private destroy$: DestroyService,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private optionService: OptionService,
    private shoppingService: ShoppingService,
    private urlService: UrlService,
    private logService: LogService
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        combineLatestWith(this.forceRefresh ? this.urlService.urlInfo$ : of(false)),
        takeUntil(this.destroy$)
      )
      .subscribe(([options]) => {
        this.options = options;
        const adsFlag = this.options['ads_flag'] || '';
        this.adsFlag =
          (env.production && ['1', '0'].includes(adsFlag)) || (!env.production && ['2', '0'].includes(adsFlag));

        if (this.dynamic && this.optionKey) {
          this.initOptions();
        }
        this.initEliteId();
        if (this.visible && this.platform.isBrowser) {
          this.fetchGoods();
        }
      });
  }

  logClick(goods: JdUnionGoodsMaterial | JdUnionGoodsJingfen, isCoupon = false) {
    this.logService
      .logAction({
        action: isCoupon ? ActionType.CLICK_JD_UNION_COUPON : ActionType.CLICK_JD_UNION,
        objectType: ActionObjectType.ADS,
        adsPosition: this.isMobile ? 'mobile' : this.position,
        goodsName: goods.skuName,
        goodsURL: goods.promotionInfo?.clickURL
      })
      .subscribe();
  }

  private initOptions() {
    const defaults: JdUnionOptions = {
      random: true,
      jingfen: true,
      eliteIds: 2,
      pageSize: 3,
      mPageSize: 1,
      visible: true
    };
    let jdUnionOptions: JdUnionOptions;
    try {
      jdUnionOptions = JSON.parse(this.options[this.optionKey]);
      jdUnionOptions = {
        ...defaults,
        ...jdUnionOptions
      };
    } catch (e) {
      jdUnionOptions = defaults;
    }
    this.isRandom = jdUnionOptions.random;
    this.isJingfen = jdUnionOptions.jingfen;
    this.pageSize = this.isMobile ? jdUnionOptions.mPageSize || 1 : jdUnionOptions.pageSize || 3;
    this.visible = jdUnionOptions.visible;
    this.eliteIds = jdUnionOptions.eliteIds;
  }

  private initEliteId() {
    if (Array.isArray(this.eliteIds)) {
      this.eliteId = this.eliteIds[Math.floor(Math.random() * this.eliteIds.length)];
    } else if (this.isRandom) {
      if (this.isJingfen) {
        this.eliteId = this.jingfenEliteIds[Math.floor(Math.random() * this.jingfenEliteIds.length)];
        if (this.eliteId === 0) {
          this.eliteId = this.otherEliteIds[Math.floor(Math.random() * this.otherEliteIds.length)];
        }
      } else {
        this.eliteId = this.materialEliteIds[Math.floor(Math.random() * this.materialEliteIds.length)];
      }
    } else {
      this.eliteId = this.eliteIds;
    }
  }

  private fetchGoods() {
    if (this.isJingfen) {
      this.fetchGoodsJingfen();
    } else {
      this.fetchGoodsMaterial();
    }
  }

  private fetchGoodsMaterial() {
    this.shoppingService
      .getGoodsMaterial({
        eliteId: this.eliteId,
        page: this.page,
        pageSize: this.pageSize,
        transfer: this.isMobile ? 0 : 1
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const code = Number(res.code);
        if (code === 0 || code === 200) {
          res.data.forEach((item) => {
            item.bestCoupon = (item.couponInfo.couponList || []).filter((c) => !!c.isBest)[0] || null;
            if (!item.bestCoupon && item.couponInfo.couponList.length > 0) {
              item.bestCoupon = item.couponInfo.couponList[0];
            }
          });
          this.goodsList = res.data;
        }
      });
  }

  private fetchGoodsJingfen() {
    this.shoppingService
      .getGoodsJingfen({
        eliteId: this.eliteId,
        page: this.page,
        pageSize: this.pageSize
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const code = Number(res.code);
        if (code === 0 || code === 200) {
          res.data.forEach((item) => {
            item.bestCoupon = (item.couponInfo.couponList || []).filter((c) => !!c.isBest)[0] || null;
            if (!item.bestCoupon && item.couponInfo.couponList.length > 0) {
              item.bestCoupon = item.couponInfo.couponList[0];
            }
          });
          if (res.data.length > this.pageSize) {
            res.data = res.data.slice(0, this.pageSize);
          }
          this.goodsList = res.data;
        }
      });
  }
}
