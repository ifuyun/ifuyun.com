import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { postPageUrlMatcher } from '../../config/matcher/post-page.matcher';
import { PostArchiveComponent } from '../post/post-archive/post-archive.component';
import { PostPageComponent } from '../post/post-page/post-page.component';
import { PostComponent } from '../post/post/post.component';
import { WallpaperArchiveComponent } from '../wallpaper/wallpaper-archive/wallpaper-archive.component';
import { WallpaperComponent } from '../wallpaper/wallpaper/wallpaper.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  // 需要在post/:postName之前
  { path: 'post/archive', component: PostArchiveComponent },
  { path: 'wallpaper/archive', component: WallpaperArchiveComponent },
  // 如果在post-routing中定义，会导致/post/post/xxx也能访问
  { path: 'post/:postName', component: PostComponent },
  { path: 'wallpaper/:wid', component: WallpaperComponent },
  // /:postSlug
  { matcher: postPageUrlMatcher, component: PostPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule {}
