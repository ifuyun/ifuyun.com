import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WallpaperArchiveComponent } from './wallpaper-archive/wallpaper-archive.component';
import { WallpaperListComponent } from './wallpaper-list/wallpaper-list.component';
import { WallpaperRoutingModule } from './wallpaper-routing.module';
import { WallpaperComponent } from './wallpaper/wallpaper.component';

@NgModule({
  imports: [
    CommonModule,
    WallpaperRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    WallpaperListComponent,
    WallpaperComponent,
    WallpaperArchiveComponent
  ],
  exports: [WallpaperListComponent, WallpaperComponent, WallpaperArchiveComponent]
})
export class WallpaperModule {}
