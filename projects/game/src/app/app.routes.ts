import { Routes } from '@angular/router';
import { ContentLayoutComponent } from 'common/components';
import { ForbiddenComponent, NotFoundComponent, ServerErrorComponent } from 'common/error';
import { GameComponent } from './pages/game-detail/game.component';
import { GameListComponent } from './pages/game-list/game-list.component';

export const routes: Routes = [
  {
    path: '',
    component: ContentLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: '/list' },
      { path: 'list', component: GameListComponent },
      { path: 'category/:category', component: GameListComponent },
      { path: 'tag/:tag', component: GameListComponent },
      { path: 'detail/:gid', component: GameComponent }
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
