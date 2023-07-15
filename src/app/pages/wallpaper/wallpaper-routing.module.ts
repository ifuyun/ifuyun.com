import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WallpaperListComponent } from './wallpaper-list/wallpaper-list.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: WallpaperListComponent },
  { path: 'archive/:year', component: WallpaperListComponent },
  { path: 'archive/:year/:month', component: WallpaperListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WallpaperRoutingModule {}
