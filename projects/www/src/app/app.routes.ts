import { Routes } from '@angular/router';
import { AuthLayoutComponent, ContentLayoutComponent } from 'common/components';
import { ForbiddenComponent, NotFoundComponent, ServerErrorComponent } from 'common/error';
import { HomeComponent } from './pages/home/home.component';
import { PageComponent } from './pages/page/page.component';
import { SearchComponent } from './pages/search/search.component';
import { Base64Component } from './pages/tool/base64/base64.component';
import { IpComponent } from './pages/tool/ip/ip.component';
import { Md5Component } from './pages/tool/md5/md5.component';
import { MurmurhashComponent } from './pages/tool/murmurhash/murmurhash.component';
import { ShoppingComponent } from './pages/tool/shopping/shopping.component';
import { ToolListComponent } from './pages/tool/tool-list/tool-list.component';
import { LoginCallbackComponent } from './pages/user/login-callback/login-callback.component';
import { LoginComponent } from './pages/user/login/login.component';
import { SignupConfirmComponent } from './pages/user/signup-confirm/signup-confirm.component';
import { SignupComponent } from './pages/user/signup/signup.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  {
    path: 'search',
    component: ContentLayoutComponent,
    children: [{ path: '', pathMatch: 'full', component: SearchComponent }]
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
