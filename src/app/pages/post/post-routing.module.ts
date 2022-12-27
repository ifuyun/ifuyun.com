import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { archiveUrlMatcher } from '../../config/post-archive.matcher';
import { postArticleUrlMatcher } from '../../config/post-article.matcher';
import { postListUrlMatcher } from '../../config/post-list.matcher';
import { postPageUrlMatcher } from '../../config/post-page.matcher';
import { taxonomyUrlMatcher } from '../../config/post-taxonomy.matcher';
import { PostArchiveComponent } from './post-archive/post-archive.component';
import { PostListComponent } from './post-list/post-list.component';
import { PostComponent } from './post/post.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: PostListComponent
  },
  {
    /* post/page-:page */
    matcher: postListUrlMatcher,
    component: PostListComponent
  },
  {
    /* category/:category, category/:category/page-:page */
    /* tag/:tag, tag/:tag/page-:page */
    matcher: taxonomyUrlMatcher,
    component: PostListComponent
  },
  {
    /* post/archive/:year */
    /* post/archive/:year/page-:page */
    /* post/archive/:year/:month */
    /* post/archive/:year/:month/page-:page */
    matcher: archiveUrlMatcher,
    component: PostListComponent
  },
  {
    /* post/:postId */
    matcher: postArticleUrlMatcher,
    component: PostComponent
  },
  {
    path: 'archive',
    component: PostArchiveComponent
  },
  {
    /* :postSlug */
    matcher: postPageUrlMatcher,
    component: PostComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PostRoutingModule {}
