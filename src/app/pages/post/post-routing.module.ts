import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { archiveUrlMatcher } from '../../config/matcher/archive.matcher';
import { postArticleUrlMatcher } from '../../config/matcher/post-article.matcher';
import { postListUrlMatcher } from '../../config/matcher/post-list.matcher';
import { postPageUrlMatcher } from '../../config/matcher/post-page.matcher';
import { taxonomyUrlMatcher } from '../../config/matcher/post-taxonomy.matcher';
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
    path: 'archive',
    component: PostArchiveComponent
  },
  {
    /* post/page-:page */
    matcher: postListUrlMatcher,
    component: PostListComponent
  },
  {
    /* post/category/:category, post/category/:category/page-:page */
    /* post/tag/:tag, post/tag/:tag/page-:page */
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
