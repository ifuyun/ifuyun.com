import { Component, Input } from '@angular/core';
import { UserAgentService } from '../../../core/user-agent.service';
import { Post } from '../post.interface';

@Component({
  selector: 'i-post-item',
  templateUrl: './post-item.component.html',
  styleUrls: []
})
export class PostItemComponent {
  @Input() post!: Post;

  isMobile = false;

  constructor(private userAgentService: UserAgentService) {
    this.isMobile = this.userAgentService.isMobile();
  }
}
