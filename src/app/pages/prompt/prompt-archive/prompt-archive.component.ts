import { Component } from '@angular/core';
import { PostType } from '../../../config/common.enum';

@Component({
  selector: 'app-prompt-archive',
  template: `<app-post-archive [postType]="postType"></app-post-archive>`
})
export class PromptArchiveComponent {
  postType = PostType.PROMPT;
}
