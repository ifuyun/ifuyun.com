import { Component, Input } from '@angular/core';
import { UserAgentService } from '../../../core/user-agent.service';
import { Post } from '../post.interface';

@Component({
  selector: 'i-post-list-view',
  templateUrl: './post-list-view.component.html',
  styleUrls: []
})
export class PostListViewComponent {
  @Input() posts: Post[] = [];

  isMobile = false;

  constructor(private userAgentService: UserAgentService) {
    this.isMobile = this.userAgentService.isMobile();
  }
}
