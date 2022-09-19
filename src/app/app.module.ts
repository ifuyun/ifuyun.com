import { APP_BASE_HREF } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TransferHttpCacheModule } from '@nguniversal/common';
import { HIGHLIGHT_OPTIONS, HighlightModule, HighlightOptions } from 'ngx-highlightjs';
import { environment as env } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BackTopModule } from './components/back-top/back-top.module';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { CarouselComponent } from './components/carousel/carousel.component';
import { EmptyComponent } from './components/empty/empty.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { LayoutComponent } from './components/layout/layout.component';
import { MessageModule } from './components/message/message.module';
import { ModalComponent } from './components/modal/modal.component';
import { PageBarComponent } from './components/page-bar/page-bar.component';
import { SiderMobileComponent } from './components/sider-mobile/sider-mobile.component';
import { SiderComponent } from './components/sider/sider.component';
import { ToolboxComponent } from './components/toolbox/toolbox.component';
import { AutofocusDirective } from './directives/autofocus.directive';
import { httpInterceptorProviders } from './interceptors/http-interceptors';
import { ArchiveComponent } from './pages/archive/archive.component';
import { LoginComponent } from './pages/login/login.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PostListComponent } from './pages/post-list/post-list.component';
import { PostComponent } from './pages/post/post.component';
import { ThirdLoginComponent } from './pages/third-login/third-login.component';
import { PipesModule } from './pipes/pipes.module';

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    HeaderComponent,
    CarouselComponent,
    BreadcrumbComponent,
    SiderComponent,
    PageBarComponent,
    FooterComponent,
    ModalComponent,
    PostListComponent,
    PostComponent,
    LoginComponent,
    ArchiveComponent,
    NotFoundComponent,
    AutofocusDirective,
    SiderMobileComponent,
    ThirdLoginComponent,
    EmptyComponent,
    ToolboxComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'blogApp' }),
    TransferHttpCacheModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    PipesModule,
    HighlightModule,
    MessageModule,
    BackTopModule
  ],
  providers: [
    httpInterceptorProviders,
    { provide: APP_BASE_HREF, useValue: env.host },
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: <HighlightOptions>{
        lineNumbers: false,
        coreLibraryLoader: () => import('highlight.js/lib/core'),
        languages: {
          typescript: () => import('highlight.js/lib/languages/typescript'),
          javascript: () => import('highlight.js/lib/languages/javascript'),
          json: () => import('highlight.js/lib/languages/json'),
          css: () => import('highlight.js/lib/languages/css'),
          less: () => import('highlight.js/lib/languages/less'),
          scss: () => import('highlight.js/lib/languages/scss'),
          xml: () => import('highlight.js/lib/languages/xml'),
          php: () => import('highlight.js/lib/languages/php'),
          java: () => import('highlight.js/lib/languages/java'),
          python: () => import('highlight.js/lib/languages/python'),
          ruby: () => import('highlight.js/lib/languages/ruby'),
          sql: () => import('highlight.js/lib/languages/sql'),
          bash: () => import('highlight.js/lib/languages/bash'),
          nginx: () => import('highlight.js/lib/languages/nginx'),
          ini: () => import('highlight.js/lib/languages/ini')
        }
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
