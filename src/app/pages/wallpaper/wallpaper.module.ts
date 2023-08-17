import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { CommentComponent } from '../../components/comment/comment.component';
import { EmptyComponent } from '../../components/empty/empty.component';
import { MakeMoneyComponent } from '../../components/make-money/make-money.component';
import { PageBarComponent } from '../../components/page-bar/page-bar.component';
import { NgZorroAntdModule } from '../../modules/antd/ng-zorro-antd.module';
import { NumberViewPipe } from '../../pipes/number-view.pipe';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { WallpaperArchiveComponent } from './wallpaper-archive/wallpaper-archive.component';
import { WallpaperItemComponent } from './wallpaper-item/wallpaper-item.component';
import { WallpaperListViewComponent } from './wallpaper-list-view/wallpaper-list-view.component';
import { WallpaperListComponent } from './wallpaper-list/wallpaper-list.component';
import { WallpaperRoutingModule } from './wallpaper-routing.module';
import { WallpaperComponent } from './wallpaper/wallpaper.component';

@NgModule({
  imports: [
    CommonModule,
    WallpaperRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgZorroAntdModule,
    BreadcrumbComponent,
    CommentComponent,
    MakeMoneyComponent,
    PageBarComponent,
    EmptyComponent,
    NumberViewPipe,
    SafeHtmlPipe
  ],
  declarations: [
    WallpaperListComponent,
    WallpaperListViewComponent,
    WallpaperItemComponent,
    WallpaperComponent,
    WallpaperArchiveComponent
  ],
  exports: [
    WallpaperListComponent,
    WallpaperListViewComponent,
    WallpaperItemComponent,
    WallpaperComponent,
    WallpaperArchiveComponent
  ]
})
export class WallpaperModule {}
