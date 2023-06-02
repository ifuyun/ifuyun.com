import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostModule } from '../post/post.module';
import { PromptListComponent } from './prompt-list/prompt-list.component';
import { PromptItemComponent } from './prompt-item/prompt-item.component';
import { PromptRoutingModule } from './prompt-routing.module';
import { PromptComponent } from './prompt/prompt.component';
import { PromptViewComponent } from './prompt-view/prompt-view.component';
import { PromptArchiveComponent } from './prompt-archive/prompt-archive.component';

@NgModule({
  imports: [CommonModule, PromptRoutingModule, PostModule],
  declarations: [
    PromptListComponent,
    PromptItemComponent,
    PromptComponent,
    PromptViewComponent,
    PromptArchiveComponent
  ],
  exports: [PromptListComponent, PromptItemComponent, PromptComponent, PromptViewComponent, PromptArchiveComponent]
})
export class PromptModule {}
