import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserAgentService } from 'common/core';
import { SiderComponent } from '../sider/sider.component';

@Component({
  selector: 'lib-content-layout',
  imports: [RouterOutlet, SiderComponent],
  templateUrl: './content-layout.component.html',
  styleUrl: './content-layout.component.less'
})
export class ContentLayoutComponent {
  private readonly uaService = inject(UserAgentService);

  readonly isMobile = this.uaService.isMobile;
}
