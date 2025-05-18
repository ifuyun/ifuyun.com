import { Routes } from '@angular/router';
import { PostArchiveComponent } from './pages/post-archive/post-archive.component';
import { PostListComponent } from './pages/post-list/post-list.component';
import { ContentLayoutComponent, PostComponent } from 'common/components';
import { ForbiddenComponent, NotFoundComponent, ServerErrorComponent } from 'common/error';

export const routes: Routes = [
  {
    path: '',
    component: ContentLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: '/list' },
      { path: 'list', component: PostListComponent },
      { path: 'category/:category', component: PostListComponent },
      { path: 'tag/:tag', component: PostListComponent },
      { path: 'archive/:year', component: PostListComponent },
      { path: 'archive/:year/:month', component: PostListComponent },
      { path: 'archive', component: PostArchiveComponent },
      { path: 'post/:slug', component: PostComponent }
    ]
  },
  {
    path: 'error',
    children: [
      { path: '403', component: ForbiddenComponent },
      { path: '404', component: NotFoundComponent },
      { path: '500', component: ServerErrorComponent }
    ]
  },
  { path: '**', redirectTo: '/error/404' }
];
