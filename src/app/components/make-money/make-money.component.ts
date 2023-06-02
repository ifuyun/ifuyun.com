import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { UserAgentService } from '../../core/user-agent.service';
import { AdsenseComponent } from '../adsense/adsense.component';
import { JdUnionGoodsComponent } from '../jd-union-goods/jd-union-goods.component';

@Component({
  selector: 'i-make-money',
  standalone: true,
  imports: [CommonModule, AdsenseComponent, JdUnionGoodsComponent],
  templateUrl: './make-money.component.html',
  styleUrls: ['./make-money.component.less']
})
export class MakeMoneyComponent implements OnInit {
  isBrowser = false;
  isMobile = false;
  jdUnionVisible = false;

  constructor(
    private destroy$: DestroyService,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private commonService: CommonService
  ) {
    this.isBrowser = this.platform.isBrowser;
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.commonService.adsFlag$.pipe(takeUntil(this.destroy$)).subscribe((flag) => {
        setTimeout(() => {
          this.jdUnionVisible = flag;
        }, 0);
      });
    }
  }
}
