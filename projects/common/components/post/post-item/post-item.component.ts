import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AppConfigService, UserAgentService } from 'common/core';
import {
  IconCalendarDateComponent,
  IconChatSquareComponent,
  IconChatSquareDotsComponent,
  IconPencilComponent
} from 'common/icons';
import { Post } from 'common/interfaces';
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
  @Input() post!: Post;
  @Input() index!: number;

  isMobile = false;
  blogHost = '';

  constructor(
    private readonly userAgentService: UserAgentService,
    private readonly appConfigService: AppConfigService
  ) {
    this.isMobile = this.userAgentService.isMobile;
    this.blogHost = this.appConfigService.apps['blog'].url;
  }
}
