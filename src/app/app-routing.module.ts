import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { postListUrlMatcher } from './config/post-list.matcher';
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
      /* post/:page */
      matcher: postListUrlMatcher,
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
