import { APP_BASE_HREF, CommonModule } from '@angular/common';
import { HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APP_ID, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { TransferHttpCacheModule } from '@nguniversal/common';
import { NZ_I18N, zh_CN } from 'ng-zorro-antd/i18n';
import { environment as env } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { SiderMobileComponent } from './components/sider-mobile/sider-mobile.component';
import { ToolboxComponent } from './components/toolbox/toolbox.component';
import { httpInterceptorProviders } from './interceptors/http-interceptors';
import { IconsProviderModule } from './modules/antd/icons-provider.module';
import { NgZorroAntdModule } from './modules/antd/ng-zorro-antd.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    TransferHttpCacheModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    CommonModule,
    NgZorroAntdModule,
    IconsProviderModule,
    HeaderComponent,
    FooterComponent,
    SiderMobileComponent,
    ToolboxComponent
  ],
  providers: [
    { provide: APP_ID, useValue: 'ifuyun' },
    { provide: APP_BASE_HREF, useValue: env.host },
    { provide: NZ_I18N, useValue: zh_CN },
    httpInterceptorProviders,
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations()
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
