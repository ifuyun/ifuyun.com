import { Component, Input } from '@angular/core';
import { UserAgentService } from '../../core/user-agent.service';

@Component({
  selector: 'app-empty',
  templateUrl: './empty.component.html',
  styleUrls: ['./empty.component.less']
})
export class EmptyComponent {
  @Input() showBorder = true;
  @Input() showBackground = true;

  isMobile = false;

  constructor(private userAgentService: UserAgentService) {
    this.isMobile = this.userAgentService.isMobile();
  }
}
