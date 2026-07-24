import { HttpStatusCode } from '@angular/common/http';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse
} from '@angular/ssr/node';
import { ApiUrl, Message } from 'common/core';
import { SitemapData } from 'common/interfaces';
import { simpleRequest } from 'common/utils';
import { environment } from 'env/environment';
import express from 'express';
import { join } from 'node:path';
import { EnumChangefreq, SitemapItemLoose, SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine({
  allowedHosts: environment.allowedHosts,
  trustProxyHeaders: environment.trustProxies
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemap: SitemapData = (
      await simpleRequest({
        url: ApiUrl.SITEMAP_GAME,
        appId: environment.appId,
        apiBase: environment.apiBase
      })
    ).data;
    const sitemapStream = new SitemapStream({
      hostname: environment.apps.game.url
    });
    const links: SitemapItemLoose[] = [
      {
        url: environment.apps.game.url,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: environment.apps.game.url + '/list',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      }
    ];
    const categories: SitemapItemLoose[] = sitemap.categories.map((item) => ({
      url: `${environment.apps.game.url}/category/${item.slug}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const tags: SitemapItemLoose[] = sitemap.tags.map((item) => ({
      url: `${environment.apps.game.url}/tag/${item.name}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));

    streamToPromise(<Readable>Readable.from(links.concat(categories, tags)).pipe(sitemapStream)).then((data) => {
      return res.type('application/xml').send(data.toString());
    });
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
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = environment.apps.game.port;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);
