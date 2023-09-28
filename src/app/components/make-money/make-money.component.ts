import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { environment as env } from '../../../environments/environment';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { UserAgentService } from '../../core/user-agent.service';
import { OptionEntity } from '../../interfaces/option.interface';
import { OptionService } from '../../services/option.service';
import { AdsenseComponent } from '../adsense/adsense.component';
import { JdUnionGoodsComponent } from '../jd-union-goods/jd-union-goods.component';

@Component({
  selector: 'i-make-money',
  templateUrl: './make-money.component.html',
  styleUrls: ['./make-money.component.less'],
  standalone: true,
  imports: [CommonModule, AdsenseComponent, JdUnionGoodsComponent],
  providers: [DestroyService]
})
export class MakeMoneyComponent implements OnInit {
  isBrowser = false;
  isMobile = false;
  adsFlag = false;
  jdUnionVisible = false;

  private options: OptionEntity = {};

  constructor(
    private destroy$: DestroyService,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private optionService: OptionService,
    private commonService: CommonService
  ) {
    this.isBrowser = this.platform.isBrowser;
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        this.options = options;
        const adsFlag = this.options['ads_flag'] || '';
        this.adsFlag =
          (env.production && ['1', '0'].includes(adsFlag)) || (!env.production && ['2', '0'].includes(adsFlag));
      });
    if (this.isBrowser) {
      this.commonService.adsFlag$.pipe(takeUntil(this.destroy$)).subscribe((flag) => {
        window.setTimeout(() => {
          this.jdUnionVisible = flag;
        }, 0);
      });
    }
  }
}
