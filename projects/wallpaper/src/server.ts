import { HttpStatusCode } from '@angular/common/http';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse
} from '@angular/ssr/node';
import { Feed } from '@fuyun/feed';
import { ApiUrl, Message } from 'common/core';
import { WallpaperLang } from 'common/enums';
import { SitemapData, Wallpaper } from 'common/interfaces';
import { simpleRequest } from 'common/utils';
import { environment } from 'env/environment';
import express, { Request, Response } from 'express';
import { uniq } from 'lodash';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EnumChangefreq, SitemapItemLoose, SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.get('/rss.xml', async (req: Request, res: Response) => {
  try {
    const { page, size, lang } = req.query;
    const { data: appInfo } = await simpleRequest({
      url: ApiUrl.TENANT_APP,
      appId: environment.appId,
      apiBase: environment.apiBase
    });
    const { data: options } = await simpleRequest({
      url: ApiUrl.OPTION_FRONTEND,
      appId: environment.appId,
      apiBase: environment.apiBase
    });
    const { data: wallpaperList } = await simpleRequest({
      url: ApiUrl.WALLPAPERS,
      param: {
        page: Number(page) || 1,
        pageSize: Math.min(Number(size) || 10, 100)
      },
      appId: environment.appId,
      apiBase: environment.apiBase
    });
    const wallpapers: Wallpaper[] = wallpaperList.list || [];
    const feed = new Feed({
      title: appInfo.appName,
      description: appInfo.appDescription,
      language: 'zh-cn',
      dcExtension: true,
      id: environment.apps.wallpaper.url,
      link: environment.apps.wallpaper.url,
      image: appInfo.appLogoUrl,
      favicon: appInfo.appFaviconUrl,
      copyright: `2014-${new Date().getFullYear()} ${appInfo.appDomain}`,
      updated: new Date(),
      generator: appInfo.appDomain,
      feedLinks: {
        rss: `${environment.apps.wallpaper.url}/rss.xml`
      },
      webMaster: options['site_author']
    });

    wallpapers.forEach((wallpaper) => {
      let copyright: string;
      let title: string;
      if (lang === WallpaperLang.EN) {
        copyright = wallpaper.wallpaperCopyrightEn || wallpaper.wallpaperCopyright;
        title = wallpaper.wallpaperTitleEn || wallpaper.wallpaperTitle;
      } else {
        copyright = wallpaper.wallpaperCopyright || wallpaper.wallpaperCopyrightEn;
        title = wallpaper.wallpaperTitle || wallpaper.wallpaperTitleEn;
      }
      const langParam = !lang ? (!!wallpaper.wallpaperCopyright ? '' : `?lang=${WallpaperLang.EN}`) : `?lang=${lang}`;

      feed.addItem({
        title: copyright,
        id: wallpaper.wallpaperId,
        link: environment.apps.wallpaper.url + '/detail/' + wallpaper.wallpaperId + langParam,
        description: title,
        creator: wallpaper.wallpaperCopyrightAuthor,
        date: new Date(wallpaper.wallpaperDate),
        image: wallpaper.wallpaperUrl
      });
    });

    res.type('application/rss+xml').send(feed.rss2());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    res.status(HttpStatusCode.InternalServerError).send(Message.ERROR_500);
  }
});
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
      hostname: environment.apps.wallpaper.url
    });

    const links: SitemapItemLoose[] = [
      {
        url: environment.apps.wallpaper.url,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: environment.apps.wallpaper.url + '/list',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: environment.apps.wallpaper.url + '/archive',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 0.8
      }
    ];
    const wallpapersCn: SitemapItemLoose[] = sitemap.wallpapers
      .filter((item) => !!item.wallpaperTitle)
      .map((item) => ({
        url: `${environment.apps.wallpaper.url}/detail/${item.wallpaperId}`,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1,
        lastmod: new Date(item.wallpaperModified).toString()
      }));
    const wallpapersEn: SitemapItemLoose[] = sitemap.wallpapers
      .filter((item) => !!item.wallpaperTitleEn)
      .map((item) => ({
        url: `${environment.apps.wallpaper.url}/detail/${item.wallpaperId}?lang=en`,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1,
        lastmod: new Date(item.wallpaperModified).toString()
      }));
    const wallpaperArchivesByMonth: SitemapItemLoose[] = sitemap.wallpaperArchives.map((item) => ({
      url: `${environment.apps.wallpaper.url}/archive/${item.dateValue}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const wallpaperArchivesByYear: SitemapItemLoose[] = uniq(
      sitemap.wallpaperArchives.map((item) => item.dateValue.split('/')[0])
    ).map((item) => ({
      url: `${environment.apps.wallpaper.url}/archive/${item}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));

    streamToPromise(
      <Readable>(
        Readable.from(links.concat(wallpapersCn, wallpapersEn, wallpaperArchivesByYear, wallpaperArchivesByMonth)).pipe(
          sitemapStream
        )
      )
    ).then((data) => res.type('application/xml').send(data.toString()));
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
  const port = environment.apps.wallpaper.port;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);
