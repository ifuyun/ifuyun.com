import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './post/layout/layout.component';

const routes: Routes = [
  { path: '', component: LayoutComponent, loadChildren: () => import('./post/post.module').then((m) => m.PostModule) },
  { path: 'wallpaper', loadChildren: () => import('./wallpaper/wallpaper.module').then((m) => m.WallpaperModule) },
  { path: 'user/login', loadChildren: () => import('./login/login.module').then((m) => m.LoginModule) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PageRoutingModule {}
