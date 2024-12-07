import { HttpStatusCode } from '@angular/common/http';
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '403',
    renderMode: RenderMode.Server,
    status: HttpStatusCode.Forbidden
  },
  {
    path: '404',
    renderMode: RenderMode.Server,
    status: HttpStatusCode.NotFound
  },
  {
    path: '500',
    renderMode: RenderMode.Server,
    status: HttpStatusCode.InternalServerError
  },
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
