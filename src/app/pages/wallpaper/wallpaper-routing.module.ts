import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WallpaperListComponent } from './wallpaper-list/wallpaper-list.component';
import { WallpaperComponent } from './wallpaper/wallpaper.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: WallpaperListComponent },
  { path: ':wid', component: WallpaperComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WallpaperRoutingModule {}
