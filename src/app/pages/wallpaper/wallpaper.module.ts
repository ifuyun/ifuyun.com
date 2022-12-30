import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentModule } from '../../components/component.module';
import { MessageModule } from '../../components/message/message.module';
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
    ComponentModule,
    PipesModule,
    FormsModule,
    ReactiveFormsModule,
    MessageModule
  ],
  exports: [WallpaperListComponent, WallpaperComponent, WallpaperArchiveComponent]
})
export class WallpaperModule {}
