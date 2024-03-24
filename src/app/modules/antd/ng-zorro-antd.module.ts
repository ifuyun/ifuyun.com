import { NgModule } from '@angular/core';
import { NzBackTopModule } from 'ng-zorro-antd/back-top';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzI18nModule } from 'ng-zorro-antd/i18n';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageModule } from 'ng-zorro-antd/message';

@NgModule({
  exports: [
    NzI18nModule,
    NzMessageModule,
    NzBackTopModule,
    NzButtonModule,
    NzFormModule,
    NzIconModule,
    NzImageModule,
    NzInputModule
  ]
})
export class NgZorroAntdModule {}
