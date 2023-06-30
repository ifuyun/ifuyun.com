import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from '../components/layout/layout.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    loadChildren: () => import('./home/home.module').then((m) => m.HomeModule)
  },
  {
    path: 'post',
    component: LayoutComponent,
    loadChildren: () => import('./post/post.module').then((m) => m.PostModule)
  },
  {
    path: 'wallpaper',
    component: LayoutComponent,
    loadChildren: () => import('./wallpaper/wallpaper.module').then((m) => m.WallpaperModule)
  },
  {
    path: 'prompt',
    component: LayoutComponent,
    loadChildren: () => import('./prompt/prompt.module').then((m) => m.PromptModule)
  },
  {
    path: 'tool',
    component: LayoutComponent,
    loadChildren: () => import('./tool/tool.module').then((m) => m.ToolModule)
  },
  {
    path: 'user/login',
    loadChildren: () => import('./user/user.module').then((m) => m.UserModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PageRoutingModule {}
