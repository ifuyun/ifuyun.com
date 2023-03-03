import { NgFor, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { EmptyComponent } from '../../../components/empty/empty.component';
import { UserAgentService } from '../../../core/user-agent.service';
import { PostItemComponent } from '../post-item/post-item.component';
import { Post } from '../post.interface';

@Component({
  selector: 'i-post-list',
  templateUrl: './post-list-view.component.html',
  styleUrls: [],
  standalone: true,
  imports: [NgFor, NgIf, PostItemComponent, EmptyComponent]
})
export class PostListViewComponent {
  @Input() postList: Post[] = [];

  isMobile = false;

  constructor(private userAgentService: UserAgentService) {
    this.isMobile = this.userAgentService.isMobile();
  }
}
