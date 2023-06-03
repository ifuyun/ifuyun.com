import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PostModule } from '../post/post.module';
import { PromptArchiveComponent } from './prompt-archive/prompt-archive.component';
import { PromptListComponent } from './prompt-list/prompt-list.component';
import { PromptRoutingModule } from './prompt-routing.module';
import { PromptComponent } from './prompt/prompt.component';

@NgModule({
  imports: [CommonModule, PromptRoutingModule, PostModule],
  declarations: [PromptListComponent, PromptComponent, PromptArchiveComponent],
  exports: [PromptListComponent, PromptComponent, PromptArchiveComponent]
})
export class PromptModule {}
