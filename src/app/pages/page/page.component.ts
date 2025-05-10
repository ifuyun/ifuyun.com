import { Component } from '@angular/core';
import { PostType } from 'src/app/enums/post';
import { PostComponent } from 'src/app/pages/post/post-detail/post.component';

@Component({
  selector: 'app-page',
  imports: [PostComponent],
  template: `<app-post [postType]="postType"></app-post>`
})
export class PageComponent {
  postType = PostType.PAGE;
}
