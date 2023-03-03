import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserAgentService } from '../../../core/user-agent.service';
import { NumberViewPipe } from '../../../pipes/number-view.pipe';
import { Post } from '../post.interface';

@Component({
  selector: 'i-post-item',
  templateUrl: './post-item.component.html',
  styleUrls: [],
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, DatePipe, NumberViewPipe]
})
export class PostItemComponent {
  @Input() post!: Post;

  isMobile = false;

  constructor(private userAgentService: UserAgentService) {
    this.isMobile = this.userAgentService.isMobile();
  }
}
