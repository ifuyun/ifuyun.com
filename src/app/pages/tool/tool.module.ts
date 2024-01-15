import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClipboardModule } from 'ngx-clipboard';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { EmptyComponent } from '../../components/empty/empty.component';
import { MakeMoneyComponent } from '../../components/make-money/make-money.component';
import { Md5Component } from './md5/md5.component';
import { MurmurhashComponent } from './murmurhash/murmurhash.component';
import { ShoppingComponent } from './shopping/shopping.component';
import { ToolRoutingModule } from './tool-routing.module';
import { ToolComponent } from './tool/tool.component';
import { Base64Component } from './base64/base64.component';

@NgModule({
  imports: [
    CommonModule,
    ToolRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ClipboardModule,
    CommonModule,
    FormsModule,
    ClipboardModule,
    BreadcrumbComponent,
    EmptyComponent,
    MakeMoneyComponent
  ],
  declarations: [ShoppingComponent, Md5Component, ToolComponent, MurmurhashComponent, Base64Component],
  exports: [ShoppingComponent, Md5Component, ToolComponent, MurmurhashComponent, Base64Component]
})
export class ToolModule {}
