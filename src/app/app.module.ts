import { registerLocaleData } from '@angular/common';
import { HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';
import zh from '@angular/common/locales/zh';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TransferHttpCacheModule } from '@nguniversal/common';
import { NZ_I18N, zh_CN } from 'ng-zorro-antd/i18n';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CrumbComponent } from './components/crumb/crumb.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { PageBarComponent } from './components/page-bar/page-bar.component';
import { SiderComponent } from './components/sider/sider.component';
import { AutofocusDirective } from './directives/autofocus.directive';
import { IconsProviderModule } from './icons-provider.module';
import { httpInterceptorProviders } from './interceptors/http-interceptors';
import { NgZorroAntdModule } from './ng-zorro-antd.module';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { PostListComponent } from './pages/post-list/post-list.component';
import { PostComponent } from './pages/post/post.component';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';

registerLocaleData(zh);

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    PostListComponent,
    PostComponent,
    LoginComponent,
    HeaderComponent,
    CrumbComponent,
    SiderComponent,
    PageBarComponent,
    FooterComponent,
    SafeHtmlPipe,
    AutofocusDirective
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'blogApp' }),
    BrowserTransferStateModule,
    AppRoutingModule,
    HttpClientModule,
    HttpClientXsrfModule.withOptions({
      cookieName: 'XSRF',
      headerName: 'x-xsrf-token'
    }),
    TransferHttpCacheModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    NgZorroAntdModule,
    IconsProviderModule
  ],
  providers: [
    httpInterceptorProviders,
    { provide: NZ_I18N, useValue: zh_CN }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
