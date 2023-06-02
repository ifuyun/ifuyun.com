import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { CarouselComponent } from '../../components/carousel/carousel.component';
import { EmptyComponent } from '../../components/empty/empty.component';
import { MakeMoneyComponent } from '../../components/make-money/make-money.component';
import { PageBarComponent } from '../../components/page-bar/page-bar.component';
import { NumberViewPipe } from '../../pipes/number-view.pipe';
import { PostModule } from '../post/post.module';
import { WallpaperModule } from '../wallpaper/wallpaper.module';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home/home.component';

@NgModule({
  imports: [
    CommonModule,
    HomeRoutingModule,
    PostModule,
    WallpaperModule,
    BreadcrumbComponent,
    CarouselComponent,
    PageBarComponent,
    MakeMoneyComponent,
    EmptyComponent,
    DatePipe,
    NumberViewPipe
  ],
  declarations: [HomeComponent],
  exports: [HomeComponent]
})
export class HomeModule {}
