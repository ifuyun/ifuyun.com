import { XhrFactory } from '@angular/common';
import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';
import { ServerXhr } from './core/server-xhr';

@NgModule({
  imports: [AppModule, ServerModule],
  providers: [{ provide: XhrFactory, useClass: ServerXhr }],
  bootstrap: [AppComponent]
})
export class AppServerModule {}
