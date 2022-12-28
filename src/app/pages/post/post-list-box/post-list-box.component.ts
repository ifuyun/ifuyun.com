import { Component, Input } from '@angular/core';
import { ResultList } from '../../../core/common.interface';
import { UserAgentService } from '../../../core/user-agent.service';
import { Post } from '../post.interface';

@Component({
  selector: 'app-post-list-box',
  templateUrl: './post-list-box.component.html',
  styleUrls: []
})
export class PostListBoxComponent {
  @Input() postList: ResultList<Post> = {};

  isMobile = false;

  constructor(private userAgentService: UserAgentService) {
    this.isMobile = this.userAgentService.isMobile();
  }
}
