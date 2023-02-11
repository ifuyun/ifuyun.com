import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentModule } from '../../components/component.module';
import { NgZorroAntdModule } from '../../modules/antd/ng-zorro-antd.module';
import { PipesModule } from '../../pipes/pipes.module';
import { WallpaperArchiveComponent } from './wallpaper-archive/wallpaper-archive.component';
import { WallpaperListComponent } from './wallpaper-list/wallpaper-list.component';
import { WallpaperRoutingModule } from './wallpaper-routing.module';
import { WallpaperComponent } from './wallpaper/wallpaper.component';

@NgModule({
  declarations: [WallpaperListComponent, WallpaperComponent, WallpaperArchiveComponent],
  imports: [
    CommonModule,
    WallpaperRoutingModule,
    PipesModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentModule,
    NgZorroAntdModule
  ],
  exports: [WallpaperListComponent, WallpaperComponent, WallpaperArchiveComponent]
})
export class WallpaperModule {}
