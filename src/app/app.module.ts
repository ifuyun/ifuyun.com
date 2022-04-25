import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TransferHttpCacheModule } from '@nguniversal/common';
import { HIGHLIGHT_OPTIONS, HighlightModule, HighlightOptions } from 'ngx-highlightjs';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { LayoutComponent } from './components/layout/layout.component';
import { MessageModule } from './components/message/message.module';
import { ModalComponent } from './components/modal/modal.component';
import { PageBarComponent } from './components/page-bar/page-bar.component';
import { SiderComponent } from './components/sider/sider.component';
import { AutofocusDirective } from './directives/autofocus.directive';
import { httpInterceptorProviders } from './interceptors/http-interceptors';
import { ArchiveComponent } from './pages/archive/archive.component';
import { LoginComponent } from './pages/login/login.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PostListComponent } from './pages/post-list/post-list.component';
import { PostComponent } from './pages/post/post.component';
import { PipesModule } from './pipes/pipes.module';

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    HeaderComponent,
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
    AutofocusDirective
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'blogApp' }),
    BrowserTransferStateModule,
    TransferHttpCacheModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    PipesModule,
    HighlightModule,
    MessageModule
  ],
  providers: [
    httpInterceptorProviders,
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: <HighlightOptions>{
        lineNumbers: true,
        coreLibraryLoader: () => import('highlight.js/lib/core'),
        // @ts-ignore
        lineNumbersLoader: () => import('highlightjs-line-numbers.js'),
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
          sql: () => import('highlight.js/lib/languages/sql'),
          bash: () => import('highlight.js/lib/languages/bash'),
          shell: () => import('highlight.js/lib/languages/shell'),
          nginx: () => import('highlight.js/lib/languages/nginx'),
          ini: () => import('highlight.js/lib/languages/ini')
        }
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
