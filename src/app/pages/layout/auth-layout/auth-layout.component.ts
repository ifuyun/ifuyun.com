import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserAgentService } from '../../../services/user-agent.service';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.less'
})
export class AuthLayoutComponent {
  isMobile = false;

  constructor(private readonly userAgentService: UserAgentService) {
    this.isMobile = this.userAgentService.isMobile;
  }
}
