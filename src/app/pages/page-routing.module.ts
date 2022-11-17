import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

const routes: Routes = [
  { path: '', component: LayoutComponent, loadChildren: () => import('./post/post.module').then((m) => m.PostModule) },
  { path: 'wallpaper', loadChildren: () => import('./wallpaper/wallpaper.module').then((m) => m.WallpaperModule) },
  {
    path: 'tool',
    component: LayoutComponent,
    loadChildren: () => import('./tool/tool.module').then((m) => m.ToolModule)
  },
  { path: 'user/login', loadChildren: () => import('./login/login.module').then((m) => m.LoginModule) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PageRoutingModule {}
