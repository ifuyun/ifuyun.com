import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { PostListComponent } from './components/post-list/post-list.component';
import { LoginComponent } from './components/login/login.component';

const routes: Routes = [{
  path: '',
  component: HomeComponent,
  children:[{
    path: '',
    component: PostListComponent
  }, {
    path: 'post/page-:page',
    component: PostListComponent
  }]
}, {
  path: 'user/login',
  component: LoginComponent
}];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabledBlocking'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
