import { Component } from '@angular/core';
import { PostType } from '../../../config/common.enum';

@Component({
  selector: 'app-prompt',
  template: `<app-post [postType]="postType"></app-post>`
})
export class PromptComponent {
  postType = PostType.PROMPT;
}
