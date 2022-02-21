import { NgModule } from '@angular/core';
import { NzI18nModule } from 'ng-zorro-antd/i18n';
import { NzMessageModule } from 'ng-zorro-antd/message';

@NgModule({
  exports: [
    NzI18nModule,
    NzMessageModule
  ]
})
export class NgZorroAntdModule {
}
