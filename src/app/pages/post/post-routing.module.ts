import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PostArchiveComponent } from './post-archive/post-archive.component';
import { PostListComponent } from './post-list/post-list.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: PostListComponent },
  { path: 'category/:category', component: PostListComponent },
  { path: 'tag/:tag', component: PostListComponent },
  { path: 'archive', component: PostArchiveComponent },
  { path: 'archive/:year', component: PostListComponent },
  { path: 'archive/:year/:month', component: PostListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PostRoutingModule {}
