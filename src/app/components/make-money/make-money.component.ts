import { Component } from '@angular/core';
import { AdsenseComponent } from 'src/app/components/adsense/adsense.component';
import { UserAgentService } from 'src/app/services/user-agent.service';

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
