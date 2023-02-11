import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ComponentModule } from '../../components/component.module';
import { NgZorroAntdModule } from '../../modules/antd/ng-zorro-antd.module';
import { PipesModule } from '../../pipes/pipes.module';
import { PostModule } from '../post/post.module';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [HomeComponent],
  imports: [CommonModule, HomeRoutingModule, ComponentModule, PipesModule, NgZorroAntdModule, PostModule],
  exports: [HomeComponent]
})
export class HomeModule {}
