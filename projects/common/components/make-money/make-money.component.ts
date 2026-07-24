import { Component, inject } from '@angular/core';
import { UserAgentService } from 'common/core';
import { AdsenseComponent } from '../adsense/adsense.component';

@Component({
  selector: 'lib-make-money',
  imports: [AdsenseComponent],
  templateUrl: './make-money.component.html'
})
export class MakeMoneyComponent {
  private readonly uaService = inject(UserAgentService);

  readonly isMobile = this.uaService.isMobile;
}
