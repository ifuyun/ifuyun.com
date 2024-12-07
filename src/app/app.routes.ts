import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { PAGE_PREFIX_BLACKLIST, REGEXP_PAGE_NAME } from './config/common.constant';
import { ForbiddenComponent } from './pages/error/forbidden/forbidden.component';
import { NotFoundComponent } from './pages/error/not-found/not-found.component';
import { ServerErrorComponent } from './pages/error/server-error/server-error.component';
import { HomeComponent } from './pages/home/home.component';
import { ContentLayoutComponent } from './pages/layout/content-layout/content-layout.component';
import { PageComponent } from './pages/page/page.component';
import { PostArchiveComponent } from './pages/post-archive/post-archive.component';
import { PostListComponent } from './pages/post-list/post-list.component';
import { PostComponent } from './pages/post/post.component';
import { SearchComponent } from './pages/search/search.component';
import { WallpaperArchiveComponent } from './pages/wallpaper-archive/wallpaper-archive.component';
import { WallpaperListComponent } from './pages/wallpaper-list/wallpaper-list.component';
import { WallpaperComponent } from './pages/wallpaper/wallpaper.component';

export function pageUrlMatcher(url: UrlSegment[]): UrlMatchResult | null {
  // /a/b, /a/b/c, /a/b/c/d, etc.
  if (url.length !== 1) {
    return null;
  }
  // exists
  if (PAGE_PREFIX_BLACKLIST.includes(url[0].path)) {
    return null;
  }
  // not a valid slug(/xxx)
  if (!REGEXP_PAGE_NAME.test(url[0].path)) {
    return null;
  }

  return {
    consumed: url,
    posParams: {
      postName: url[0]
    }
  };
}

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  {
    path: 'post',
    component: ContentLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', component: PostListComponent },
      { path: 'category/:category', component: PostListComponent },
      { path: 'tag/:tag', component: PostListComponent },
      { path: 'archive/:year', component: PostListComponent },
      { path: 'archive/:year/:month', component: PostListComponent },
      { path: 'archive', component: PostArchiveComponent },
      { path: ':postName', component: PostComponent }
    ]
  },
  {
    path: 'wallpaper',
    component: ContentLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', component: WallpaperListComponent },
      { path: 'archive/:year', component: WallpaperListComponent },
      { path: 'archive/:year/:month', component: WallpaperListComponent },
      { path: 'archive', component: WallpaperArchiveComponent },
      { path: ':wid', component: WallpaperComponent }
    ]
  },
  {
    path: 'search',
    component: ContentLayoutComponent,
    children: [{ path: '', pathMatch: 'full', component: SearchComponent }]
  },
  {
    path: 'error',
    children: [
      { path: '403', component: ForbiddenComponent },
      { path: '404', component: NotFoundComponent },
      { path: '500', component: ServerErrorComponent }
    ]
  },
  {
    matcher: pageUrlMatcher,
    component: ContentLayoutComponent,
    children: [{ path: '', pathMatch: 'full', component: PageComponent }]
  },
  { path: '**', redirectTo: '/error/404' }
];
