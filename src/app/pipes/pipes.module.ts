import { NgModule } from '@angular/core';
import { CopyrightTypePipe } from './copyright-type.pipe';
import { SafeHtmlPipe } from './safe-html.pipe';
import { NumberViewPipe } from './number-view.pipe';

@NgModule({
  declarations: [
    SafeHtmlPipe,
    CopyrightTypePipe,
    NumberViewPipe
  ],
  imports: [],
  exports: [
    SafeHtmlPipe,
    CopyrightTypePipe,
    NumberViewPipe
  ]
})
export class PipesModule {
}
