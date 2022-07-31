import { Component } from '@angular/core';
import { UserAgentService } from '../../core/user-agent.service';

@Component({
  selector: 'app-empty',
  templateUrl: './empty.component.html',
  styleUrls: ['./empty.component.less']
})
export class EmptyComponent {
  isMobile = false;

  constructor(
    private userAgentService: UserAgentService
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }
}
