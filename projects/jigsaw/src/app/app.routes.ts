import { Routes } from '@angular/router';
import { ContentLayoutComponent } from 'common/components';
import { ForbiddenComponent, NotFoundComponent, ServerErrorComponent } from 'common/error';
import { WallpaperJigsawListComponent } from './pages/wallpaper-jigsaw-list/wallpaper-jigsaw-list.component';
import { WallpaperJigsawComponent } from './pages/wallpaper-jigsaw/wallpaper-jigsaw.component';

export const routes: Routes = [
  {
    path: '',
    component: ContentLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: '/list' },
      { path: 'list', component: WallpaperJigsawListComponent },
      { path: 'detail/:wid', component: WallpaperJigsawComponent }
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
