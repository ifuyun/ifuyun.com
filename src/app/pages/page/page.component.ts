import { Component } from '@angular/core';
import { PostType } from '../../enums/post';
import { PostComponent } from '../post/post.component';

@Component({
  selector: 'app-page',
  imports: [PostComponent],
  template: `<app-post [postType]="postType"></app-post>`
})
export class PageComponent {
  postType = PostType.PAGE;
}
