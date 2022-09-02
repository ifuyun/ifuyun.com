import { NgModule } from '@angular/core';
import { CopyrightTypeDescPipe } from './copyright-type-desc.pipe';
import { CopyrightTypePipe } from './copyright-type.pipe';
import { SafeHtmlPipe } from './safe-html.pipe';
import { NumberViewPipe } from './number-view.pipe';
import { CommentHashPipe } from './comment-hash.pipe';

@NgModule({
  declarations: [SafeHtmlPipe, CopyrightTypePipe, CopyrightTypeDescPipe, NumberViewPipe, CommentHashPipe],
  imports: [],
  exports: [SafeHtmlPipe, CopyrightTypePipe, CopyrightTypeDescPipe, NumberViewPipe, CommentHashPipe]
})
export class PipesModule {}
