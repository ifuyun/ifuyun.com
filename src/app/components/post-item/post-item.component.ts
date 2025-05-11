import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DomainLink } from 'src/app/directives/domain-link';
import { Post } from 'src/app/interfaces/post';
import { NumberViewPipe } from 'src/app/pipes/number-view.pipe';
import { UserAgentService } from 'src/app/services/user-agent.service';

@Component({
  selector: 'app-post-item',
  imports: [NgIf, NgFor, NzIconModule, DatePipe, NumberViewPipe, DomainLink],
  templateUrl: './post-item.component.html',
  styleUrl: './post-item.component.less'
})
export class PostItemComponent {
  @Input() post!: Post;
  @Input() index!: number;

  isMobile = false;

  constructor(private readonly userAgentService: UserAgentService) {
    this.isMobile = this.userAgentService.isMobile;
  }
}
