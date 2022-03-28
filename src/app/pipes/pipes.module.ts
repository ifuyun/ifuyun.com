import { NgModule } from '@angular/core';
import { CopyrightTypePipe } from './copyright-type.pipe';
import { SafeHtmlPipe } from './safe-html.pipe';

@NgModule({
  declarations: [
    SafeHtmlPipe,
    CopyrightTypePipe
  ],
  imports: [],
  exports: [
    SafeHtmlPipe,
    CopyrightTypePipe
  ]
})
export class PipesModule {
}
