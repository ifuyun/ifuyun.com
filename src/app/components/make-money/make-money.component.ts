import { Component } from '@angular/core';
import { UserAgentService } from '../../services/user-agent.service';
import { AdsenseComponent } from '../adsense/adsense.component';

@Component({
  selector: 'app-make-money',
  imports: [AdsenseComponent],
  templateUrl: './make-money.component.html'
})
export class MakeMoneyComponent {
  isMobile = false;

  constructor(private readonly userAgentService: UserAgentService) {
    this.isMobile = this.userAgentService.isMobile;
  }
}
