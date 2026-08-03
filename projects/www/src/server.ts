import { HttpStatusCode } from '@angular/common/http';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse
} from '@angular/ssr/node';
import { TOOL_LINKS } from 'common/components';
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
        url: ApiUrl.SITEMAP_PAGE,
        appId: environment.appId,
        apiBase: environment.apiBase
      })
    ).data;
    const sitemapStream = new SitemapStream({
      hostname: environment.apps.www.url
    });

    const links: SitemapItemLoose[] = [
      {
        url: environment.apps.www.url,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: environment.apps.blog.url,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: environment.apps.wallpaper.url,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: environment.apps.game.url,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: environment.apps.www.url + '/tool',
        changefreq: EnumChangefreq.WEEKLY,
        priority: 0.8
      },
      {
        url: environment.apps.www.url + '/user/signin',
        changefreq: EnumChangefreq.MONTHLY,
        priority: 0.8
      },
      {
        url: environment.apps.www.url + '/user/signup',
        changefreq: EnumChangefreq.MONTHLY,
        priority: 0.8
      }
    ];
    const pages: SitemapItemLoose[] = sitemap.posts.map((item) => ({
      url: environment.apps.www.url + item.url,
      changefreq: EnumChangefreq.DAILY,
      priority: 1,
      lastmod: new Date(item.updatedAt).toString()
    }));
    const tools: SitemapItemLoose[] = TOOL_LINKS.map((item) => ({
      url: environment.apps.www.url + item.url,
      changefreq: <EnumChangefreq>item.changefreq,
      priority: item.priority
    }));

    streamToPromise(<Readable>Readable.from(links.concat(pages, tools)).pipe(sitemapStream)).then((data) => {
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
  const port = environment.apps.www.port;
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
