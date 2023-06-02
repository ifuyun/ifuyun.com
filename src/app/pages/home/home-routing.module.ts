import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { postPageUrlMatcher } from '../../config/matcher/post-page.matcher';
import { PostPageComponent } from '../post/post-page/post-page.component';
import { PostComponent } from '../post/post/post.component';
import { PromptComponent } from '../prompt/prompt/prompt.component';
import { WallpaperComponent } from '../wallpaper/wallpaper/wallpaper.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: 'post/:postName', component: PostComponent },
  { path: 'wallpaper/:wid', component: WallpaperComponent },
  { path: 'prompt/:postName', component: PromptComponent },
  // /:postSlug
  { matcher: postPageUrlMatcher, component: PostPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule {}
