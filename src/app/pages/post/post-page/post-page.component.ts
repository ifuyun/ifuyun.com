import { Component } from '@angular/core';
import { PostType } from '../../../config/common.enum';

@Component({
  selector: 'app-post-page',
  template: `<app-post [postType]="postType"></app-post>`
})
export class PostPageComponent {
  postType = PostType.PAGE;
}
