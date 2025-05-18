import { Component } from '@angular/core';
import { PostComponent } from 'common/components';
import { PostType } from 'common/enums';

@Component({
  selector: 'app-page',
  imports: [PostComponent],
  template: `<lib-post [postType]="postType"></lib-post>`
})
export class PageComponent {
  postType = PostType.PAGE;
}
