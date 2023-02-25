import { APP_BASE_HREF } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TransferHttpCacheModule } from '@nguniversal/common';
import { environment as env } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ComponentModule } from './components/component.module';
import { httpInterceptorProviders } from './interceptors/http-interceptors';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PipesModule } from './pipes/pipes.module';

@NgModule({
  declarations: [AppComponent, NotFoundComponent],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ifuyun' }),
    TransferHttpCacheModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    PipesModule,
    ComponentModule
  ],
  providers: [
    httpInterceptorProviders,
    { provide: APP_BASE_HREF, useValue: env.host }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
