import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { AppConfigService, UserAgentService } from 'common/core';
import {
  IconCalendarDateComponent,
  IconChatSquareComponent,
  IconChatSquareDotsComponent,
  IconPencilComponent
} from 'common/icons';
import { PostVo } from 'common/interfaces';
import { NumberViewPipe } from 'common/pipes';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SmartLinkComponent } from '../../smart-link/smart-link.component';

@Component({
  selector: 'lib-post-item',
  imports: [
    NzIconModule,
    DatePipe,
    NumberViewPipe,
    SmartLinkComponent,
    IconCalendarDateComponent,
    IconChatSquareDotsComponent,
    IconChatSquareComponent,
    IconPencilComponent
  ],
  templateUrl: './post-item.component.html',
  styleUrl: './post-item.component.less'
})
export class PostItemComponent {
  private readonly uaService = inject(UserAgentService);
  private readonly appConfigService = inject(AppConfigService);

  readonly post = input.required<PostVo>();
  readonly index = input.required<number>();

  readonly isMobile = this.uaService.isMobile;
  readonly blogHost = this.appConfigService.apps['blog'].url;
}
