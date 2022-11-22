import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PlatformService } from '../../core/platform.service';
import { UserAgentService } from '../../core/user-agent.service';
import { JdUnionGoodsMaterial } from '../../pages/tool/jd-union.interface';
import { ShoppingService } from '../../pages/tool/shopping/shopping.service';
import { MessageService } from '../message/message.service';

@Component({
  selector: 'i-jd-union-goods',
  templateUrl: './jd-union-goods.component.html',
  styleUrls: ['./jd-union-goods.component.less']
})
export class JdUnionGoodsComponent implements OnInit, OnDestroy {
  @Input() eliteId = 1;
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() showHeader = true;

  isMobile = false;
  goodsList: JdUnionGoodsMaterial[] = [];

  private goodsListener!: Subscription;

  constructor(
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private shoppingService: ShoppingService,
    private message: MessageService
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    if (this.platform.isBrowser) {
      this.fetchGoods();
    }
  }

  ngOnDestroy(): void {
    this.goodsListener?.unsubscribe();
  }

  private fetchGoods() {
    this.goodsListener = this.shoppingService
      .getGoodsMaterial({
        eliteId: this.eliteId,
        page: this.page,
        pageSize: this.pageSize,
        transfer: this.isMobile ? 0 : 1
      })
      .subscribe((res) => {
        const code = Number(res.code);
        if (code !== 0 && code !== 200) {
          this.message.error(res.message);
        } else {
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
}
