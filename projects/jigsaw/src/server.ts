import { HttpStatusCode } from '@angular/common/http';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse
} from '@angular/ssr/node';
import { ApiUrl, Message } from 'common/core';
import { SitemapData } from 'common/interfaces';
import { antiCrawlers } from 'common/middlewares';
import { simpleRequest } from 'common/utils';
import { environment } from 'env/environment';
import express, { Request, Response } from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EnumChangefreq, SitemapItemLoose, SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(antiCrawlers);
app.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const sitemap: SitemapData = (
      await simpleRequest({
        url: ApiUrl.SITEMAP_WALLPAPER,
        appId: environment.appId,
        apiBase: environment.apiBase
      })
    ).data;
    const sitemapStream = new SitemapStream({
      hostname: environment.apps.jigsaw.url
    });
    const links: SitemapItemLoose[] = [
      {
        url: environment.apps.jigsaw.url,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: environment.apps.jigsaw.url + '/list',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      }
    ];
    const wallpapers: SitemapItemLoose[] = sitemap.wallpapers.map((item) => ({
      url: `${environment.apps.jigsaw.url}/detail/${item.wallpaperId}`,
      changefreq: EnumChangefreq.ALWAYS,
      priority: 1,
      lastmod: new Date(item.wallpaperModified).toString()
    }));

    streamToPromise(<Readable>Readable.from(links.concat(wallpapers)).pipe(sitemapStream)).then((data) =>
      res.type('application/xml').send(data.toString())
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    res.status(HttpStatusCode.InternalServerError).send(Message.ERROR_500);
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false
  })
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 *
 * pm2 环境下 isMainModule(import.meta.url) 始终为 false，因此需要额外判断路径
 */
if (isMainModule(import.meta.url) || !import.meta.url.includes('/.angular/')) {
  const port = environment.apps.jigsaw.port;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);
