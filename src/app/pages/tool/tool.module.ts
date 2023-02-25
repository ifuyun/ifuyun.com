import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClipboardModule } from 'ngx-clipboard';
import { ComponentModule } from '../../components/component.module';
import { PipesModule } from '../../pipes/pipes.module';
import { Md5Component } from './md5/md5.component';
import { MurmurhashComponent } from './murmurhash/murmurhash.component';
import { ShoppingComponent } from './shopping/shopping.component';
import { ToolRoutingModule } from './tool-routing.module';
import { ToolComponent } from './tool/tool.component';

@NgModule({
  declarations: [ShoppingComponent, Md5Component, ToolComponent, MurmurhashComponent],
  imports: [
    CommonModule,
    ToolRoutingModule,
    ComponentModule,
    PipesModule,
    FormsModule,
    ReactiveFormsModule,
    ClipboardModule
  ]
})
export class ToolModule {}
