import { Routes } from '@angular/router';
import { ContentLayoutComponent } from 'common/components';
import { ForbiddenComponent, NotFoundComponent, ServerErrorComponent } from 'common/error';
import { WallpaperArchiveComponent } from './pages/wallpaper-archive/wallpaper-archive.component';
import { WallpaperComponent } from './pages/wallpaper-detail/wallpaper.component';
import { WallpaperFutureListComponent } from './pages/wallpaper-future-list/wallpaper-future-list.component';
import { WallpaperListComponent } from './pages/wallpaper-list/wallpaper-list.component';

export const routes: Routes = [
  {
    path: '',
    component: ContentLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: '/list' },
      { path: 'list', component: WallpaperListComponent },
      { path: 'future', component: WallpaperFutureListComponent },
      { path: 'archive/:year', component: WallpaperListComponent },
      { path: 'archive/:year/:month', component: WallpaperListComponent },
      { path: 'archive', component: WallpaperArchiveComponent },
      { path: 'detail/:wid', component: WallpaperComponent }
    ]
  },
  {
    path: 'error',
    children: [
      { path: '403', component: ForbiddenComponent },
      { path: '404', component: NotFoundComponent },
      { path: '500', component: ServerErrorComponent }
    ]
  },
  { path: '**', redirectTo: '/error/404' }
];
