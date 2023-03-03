import { APP_BASE_HREF, CommonModule } from '@angular/common';
import { HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { TransferHttpCacheModule } from '@nguniversal/common';
import { environment as env } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BackTopComponent } from './components/back-top/back-top.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { SiderMobileComponent } from './components/sider-mobile/sider-mobile.component';
import { ToolboxComponent } from './components/toolbox/toolbox.component';
import { httpInterceptorProviders } from './interceptors/http-interceptors';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ifuyun' }),
    TransferHttpCacheModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    CommonModule,
    HeaderComponent,
    FooterComponent,
    SiderMobileComponent,
    ToolboxComponent,
    BackTopComponent
  ],
  providers: [
    httpInterceptorProviders,
    { provide: APP_BASE_HREF, useValue: env.host },
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations()
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
