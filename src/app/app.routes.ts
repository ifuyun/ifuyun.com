import { Routes } from '@angular/router';
import { LoginCallbackComponent } from './pages/auth/login-callback/login-callback.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { SignupConfirmComponent } from './pages/auth/signup-confirm/signup-confirm.component';
import { SignupComponent } from './pages/auth/signup/signup.component';
import { ForbiddenComponent } from './pages/error/forbidden/forbidden.component';
import { NotFoundComponent } from './pages/error/not-found/not-found.component';
import { ServerErrorComponent } from './pages/error/server-error/server-error.component';
import { GameComponent } from './pages/game/game-detail/game.component';
import { GameListComponent } from './pages/game/game-list/game-list.component';
import { HomeComponent } from './pages/home/home.component';
import { WallpaperJigsawListComponent } from './pages/jigsaw/wallpaper-jigsaw-list/wallpaper-jigsaw-list.component';
import { WallpaperJigsawComponent } from './pages/jigsaw/wallpaper-jigsaw/wallpaper-jigsaw.component';
import { AuthLayoutComponent } from './pages/layout/auth-layout/auth-layout.component';
import { ContentLayoutComponent } from './pages/layout/content-layout/content-layout.component';
import { PageComponent } from './pages/page/page.component';
import { PostArchiveComponent } from './pages/post/post-archive/post-archive.component';
import { PostComponent } from './pages/post/post-detail/post.component';
import { PostListComponent } from './pages/post/post-list/post-list.component';
import { SearchComponent } from './pages/search/search.component';
import { Base64Component } from './pages/tool/base64/base64.component';
import { IpComponent } from './pages/tool/ip/ip.component';
import { Md5Component } from './pages/tool/md5/md5.component';
import { MurmurhashComponent } from './pages/tool/murmurhash/murmurhash.component';
import { ShoppingComponent } from './pages/tool/shopping/shopping.component';
import { ToolListComponent } from './pages/tool/tool-list/tool-list.component';
import { WallpaperArchiveComponent } from './pages/wallpaper/wallpaper-archive/wallpaper-archive.component';
import { WallpaperComponent } from './pages/wallpaper/wallpaper-detail/wallpaper.component';
import { WallpaperListComponent } from './pages/wallpaper/wallpaper-list/wallpaper-list.component';

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
      { path: ':slug', component: PostComponent }
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
    path: 'jigsaw',
    component: ContentLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', component: WallpaperJigsawListComponent },
      { path: ':wid', component: WallpaperJigsawComponent }
    ]
  },
  {
    path: 'search',
    component: ContentLayoutComponent,
    children: [{ path: '', pathMatch: 'full', component: SearchComponent }]
  },
  {
    path: 'game',
    component: ContentLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', component: GameListComponent },
      { path: 'category/:category', component: GameListComponent },
      { path: 'tag/:tag', component: GameListComponent },
      { path: ':gid', component: GameComponent }
    ]
  },
  {
    path: 'tool',
    component: ContentLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', component: ToolListComponent },
      { path: 'md5', component: Md5Component },
      { path: 'base64', component: Base64Component },
      { path: 'murmurhash', component: MurmurhashComponent },
      { path: 'ip', component: IpComponent },
      { path: 'shopping', component: ShoppingComponent }
    ]
  },
  {
    path: 'user',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'login/callback', component: LoginCallbackComponent, data: { bg: false } },
      { path: 'signup', component: SignupComponent },
      { path: 'confirm', component: SignupConfirmComponent }
    ],
    data: {
      centered: true
    }
  },
  {
    path: ':slug',
    component: ContentLayoutComponent,
    children: [{ path: '', pathMatch: 'full', component: PageComponent }]
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
