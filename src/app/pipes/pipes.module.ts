import { NgModule } from '@angular/core';
import { CopyrightTypeDescPipe } from './copyright-type-desc.pipe';
import { CopyrightTypePipe } from './copyright-type.pipe';
import { SafeHtmlPipe } from './safe-html.pipe';
import { NumberViewPipe } from './number-view.pipe';

@NgModule({
  declarations: [
    SafeHtmlPipe,
    CopyrightTypePipe,
    CopyrightTypeDescPipe,
    NumberViewPipe
  ],
  imports: [],
  exports: [
    SafeHtmlPipe,
    CopyrightTypePipe,
    CopyrightTypeDescPipe,
    NumberViewPipe
  ]
})
export class PipesModule {
}
