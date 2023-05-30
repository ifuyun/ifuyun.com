import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { postPageUrlMatcher } from '../../config/matcher/post-page.matcher';
import { PostComponent } from '../post/post/post.component';
import { WallpaperComponent } from '../wallpaper/wallpaper/wallpaper.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: 'post/:postName', component: PostComponent },
  { path: 'wallpaper/:wid', component: WallpaperComponent },
  // /:postSlug
  { matcher: postPageUrlMatcher, component: PostComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule {}
