import { Component } from '@angular/core';
import { UserAgentService } from 'common/core';
import { AdsenseComponent } from '../adsense/adsense.component';

@Component({
  selector: 'lib-make-money',
  imports: [AdsenseComponent],
  templateUrl: './make-money.component.html'
})
export class MakeMoneyComponent {
  isMobile = false;

  constructor(private readonly userAgentService: UserAgentService) {
    this.isMobile = this.userAgentService.isMobile;
  }
}
