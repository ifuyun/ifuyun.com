import { XhrFactory } from '@angular/common';
import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { NZ_I18N, NzI18nModule, zh_CN } from 'ng-zorro-antd/i18n';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';
import { ServerXhr } from './core/server-xhr';
import { IconsProviderModule } from './modules/antd/icons-provider.module';

@NgModule({
  imports: [AppModule, ServerModule, NzI18nModule, IconsProviderModule],
  providers: [
    { provide: XhrFactory, useClass: ServerXhr },
    { provide: NZ_I18N, useValue: zh_CN }
  ],
  bootstrap: [AppComponent]
})
export class AppServerModule {}
