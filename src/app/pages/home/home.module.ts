import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PostModule } from '../post/post.module';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home/home.component';

@NgModule({
  imports: [CommonModule, HomeRoutingModule, PostModule, HomeComponent],
  exports: [HomeComponent]
})
export class HomeModule {}
