import { NgModule } from '@angular/core';
import { EyeOutline, EyeInvisibleOutline, UserAddOutline } from '@ant-design/icons-angular/icons';
import { NZ_ICONS, NzIconModule } from 'ng-zorro-antd/icon';

const icons = [EyeOutline, EyeInvisibleOutline, UserAddOutline];

@NgModule({
  imports: [NzIconModule],
  exports: [NzIconModule],
  providers: [{ provide: NZ_ICONS, useValue: icons }]
})
export class IconsProviderModule {}
