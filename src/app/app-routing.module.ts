import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { archiveUrlMatcher } from './config/post-archive.matcher';
import { postListUrlMatcher } from './config/post-list.matcher';
import { postStandaloneUrlMatcher } from './config/post-standalone.matcher';
import { taxonomyUrlMatcher } from './config/post-taxonomy.matcher';
import { postUrlMatcher } from './config/post.matcher';
import { ArchiveComponent } from './pages/archive/archive.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PostListComponent } from './pages/post-list/post-list.component';
import { PostComponent } from './pages/post/post.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [{
      path: '',
      pathMatch: 'full',
      component: PostListComponent
    }, {
      /* post/page-:page */
      matcher: postListUrlMatcher,
      component: PostListComponent
    }, {
      /* category/:category, category/:category/page-:page */
      /* tag/:tag, tag/:tag/page-:page */
      matcher: taxonomyUrlMatcher,
      component: PostListComponent
    }, {
      /* archive/:year */
      /* archive/:year/page-:page */
      /* archive/:year/:month */
      /* archive/:year/:month/page-:page */
      matcher: archiveUrlMatcher,
      component: PostListComponent
    }, {
      /* post/:postId */
      matcher: postUrlMatcher,
      component: PostComponent
    }, {
      path: 'archive',
      component: ArchiveComponent
    }, {
      /* :postSlug */
      matcher: postStandaloneUrlMatcher,
      component: PostComponent
    }]
  }, {
    path: 'user/login',
    component: LoginComponent
  }, {
    path: '**',
    component: NotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabledBlocking',
    anchorScrolling: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
