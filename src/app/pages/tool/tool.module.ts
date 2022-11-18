import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClipboardModule } from 'ngx-clipboard';
import { ComponentModule } from '../../components/component.module';
import { MessageModule } from '../../components/message/message.module';
import { PipesModule } from '../../pipes/pipes.module';
import { ToolRoutingModule } from './tool-routing.module';
import { ShoppingComponent } from './shopping/shopping.component';
import { Md5Component } from './md5/md5.component';

@NgModule({
  declarations: [ShoppingComponent, Md5Component],
  imports: [
    CommonModule,
    ToolRoutingModule,
    ComponentModule,
    PipesModule,
    FormsModule,
    ReactiveFormsModule,
    MessageModule,
    ClipboardModule
  ]
})
export class ToolModule {}
