import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Post } from '../../interfaces/post';
import { NumberViewPipe } from '../../pipes/number-view.pipe';
import { UserAgentService } from '../../services/user-agent.service';

@Component({
  selector: 'app-post-item',
  imports: [NgIf, NgFor, RouterLink, NzIconModule, DatePipe, NumberViewPipe],
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
