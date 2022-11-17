import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentModule } from '../../components/component.module';
import { MessageModule } from '../../components/message/message.module';
import { PipesModule } from '../../pipes/pipes.module';
import { ToolRoutingModule } from './tool-routing.module';
import { ShoppingComponent } from './shopping/shopping.component';

@NgModule({
  declarations: [ShoppingComponent],
  imports: [
    CommonModule,
    ToolRoutingModule,
    ComponentModule,
    PipesModule,
    FormsModule,
    ReactiveFormsModule,
    MessageModule
  ]
})
export class ToolModule {}
