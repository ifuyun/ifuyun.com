import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { archiveUrlMatcher } from '../../config/matcher/archive.matcher';
import { WallpaperArchiveComponent } from './wallpaper-archive/wallpaper-archive.component';
import { WallpaperListComponent } from './wallpaper-list/wallpaper-list.component';
import { WallpaperComponent } from './wallpaper/wallpaper.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: WallpaperListComponent },
  {
    path: 'archive',
    component: WallpaperArchiveComponent
  },
  {
    /* wallpaper/archive/:year */
    /* wallpaper/archive/:year/page-:page */
    /* wallpaper/archive/:year/:month */
    /* wallpaper/archive/:year/:month/page-:page */
    matcher: archiveUrlMatcher,
    component: WallpaperListComponent
  },
  { path: ':wid', component: WallpaperComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WallpaperRoutingModule {}
