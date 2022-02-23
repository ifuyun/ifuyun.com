import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { archiveUrlMatcher } from './config/post-archive.matcher';
import { postListUrlMatcher } from './config/post-list.matcher';
import { taxonomyUrlMatcher } from './config/post-taxonomy.matcher';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { PostListComponent } from './pages/post-list/post-list.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [{
      path: '',
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
      /* 'archive/:year' */
      /* 'archive/:year/page-:page' */
      /* 'archive/:year/:month' */
      /* 'archive/:year/:month/page-:page' */
      matcher: archiveUrlMatcher,
      component: PostListComponent
    }]
  }, {
    path: 'user/login',
    component: LoginComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabledBlocking'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
