import { HttpStatusCode } from '@angular/common/http';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse
} from '@angular/ssr/node';
import { Feed } from '@fuyun/feed';
import { ApiUrl, Message } from 'common/core';
import { Post, SitemapData } from 'common/interfaces';
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
    const { page, size, detail } = req.query;
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
    const showDetail = detail === '1';
    const { data: postList } = await simpleRequest({
      url: ApiUrl.POST_RSS,
      param: {
        page: Number(page) || 1,
        pageSize: Math.min(Number(size) || 10, 100),
        detail: showDetail ? 1 : 0,
        sticky: 0
      },
      appId: environment.appId,
      apiBase: environment.apiBase
    });
    const posts: Post[] = postList.list || [];
    const feed = new Feed({
      title: appInfo.appName,
      description: appInfo.appDescription,
      language: 'zh-cn',
      dcExtension: true,
      id: environment.apps.blog.url,
      link: environment.apps.blog.url,
      image: appInfo.appLogoUrl,
      favicon: appInfo.appFaviconUrl,
      copyright: `2014-${new Date().getFullYear()} ${appInfo.appDomain}`,
      updated: new Date(),
      generator: appInfo.appDomain,
      feedLinks: {
        rss: `${environment.apps.blog.url}/rss.xml`
      },
      webMaster: options['site_author']
    });

    posts.forEach((item) => {
      const post = item.post;
      feed.addItem({
        title: post.postTitle,
        id: post.postId,
        link: environment.apps.blog.url + post.postGuid,
        description: post.postExcerpt,
        content: showDetail ? post.postContent : post.postExcerpt,
        creator: item.meta['post_author'] || post.owner.userNickname,
        category: item.categories.map((category) => ({ name: category.taxonomySlug })),
        date: new Date(post.postDate),
        image: post.cover
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
        url: ApiUrl.SITEMAP_POST,
        appId: environment.appId,
        apiBase: environment.apiBase
      })
    ).data;
    const sitemapStream = new SitemapStream({
      hostname: environment.apps.blog.url
    });
    const links: SitemapItemLoose[] = [
      {
        url: environment.apps.blog.url,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: environment.apps.blog.url + '/list',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: environment.apps.blog.url + '/archive',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 0.8
      }
    ];
    const posts: SitemapItemLoose[] = sitemap.posts.map((item) => ({
      url: environment.apps.blog.url + item.postGuid,
      changefreq: EnumChangefreq.ALWAYS,
      priority: 1,
      lastmod: new Date(item.postModified).toString()
    }));
    const postArchivesByMonth: SitemapItemLoose[] = sitemap.postArchives.map((item) => ({
      url: `${environment.apps.blog.url}/archive/${item.dateValue}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const postArchivesByYear: SitemapItemLoose[] = uniq(
      sitemap.postArchives.map((item) => item.dateValue.split('/')[0])
    ).map((item) => ({
      url: `${environment.apps.blog.url}/archive/${item}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const taxonomies: SitemapItemLoose[] = sitemap.taxonomies.map((item) => ({
      url: `${environment.apps.blog.url}/category/${item.taxonomySlug}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const tags: SitemapItemLoose[] = sitemap.tags.map((item) => ({
      url: `${environment.apps.blog.url}/tag/${item.tagName}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));

    streamToPromise(
      <Readable>(
        Readable.from(links.concat(posts, taxonomies, tags, postArchivesByYear, postArchivesByMonth)).pipe(
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
  const port = environment.apps.blog.port;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);
