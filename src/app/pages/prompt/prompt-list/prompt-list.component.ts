import { Component } from '@angular/core';
import { PostType } from '../../../config/common.enum';

@Component({
  selector: 'app-prompt-list',
  template: `<app-post-list [postType]="postType"></app-post-list>`
})
export class PromptListComponent {
  postType = PostType.PROMPT;
}
