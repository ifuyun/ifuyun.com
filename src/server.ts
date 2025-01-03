import { HttpStatusCode } from '@angular/common/http';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse
} from '@angular/ssr/node';
import { Feed } from '@fuyun/feed';
import express, { Request, Response } from 'express';
import { uniq } from 'lodash';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EnumChangefreq, SitemapItemLoose, SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import { ApiUrl } from './app/config/api-url';
import { Message } from './app/config/message.enum';
import { PostType } from './app/enums/post';
import { WallpaperLang } from './app/enums/wallpaper';
import { Post } from './app/interfaces/post';
import { SitemapData } from './app/interfaces/sitemap';
import { Wallpaper } from './app/interfaces/wallpaper';
import { TOOL_LINKS, TOOL_URL_ENTRY } from './app/pages/tool/tool.constant';
import { environment } from './environments/environment';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

const request = async (url: string, param: Record<string, any> = {}) => {
  const reqParam = Object.entries(param)
    .map((item) => `${item[0]}=${item[1]}`)
    .join('&');
  const urlParam = `?appId=${environment.appId}${reqParam ? '&' + reqParam : ''}`;
  const response = await fetch(environment.apiBase + url + urlParam, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(Message.ERROR_500);
  }
  return response.json();
};

app.get('/rss.xml', async (req: Request, res: Response) => {
  try {
    const { page, size, detail } = req.query;
    const showDetail = detail === '1';
    const { data: appInfo } = await request(ApiUrl.TENANT_APP);
    const { data: options } = await request(ApiUrl.OPTION_FRONTEND);
    const { data: postList } = await request(ApiUrl.POST_RSS, {
      page: Number(page) || 1,
      pageSize: Math.min(Number(size) || 10, 100),
      detail: showDetail ? 1 : 0,
      sticky: 0
    });
    const posts: Post[] = postList.list || [];
    const feed = new Feed({
      title: appInfo.appName,
      description: appInfo.appDescription,
      language: 'zh-cn',
      dcExtension: true,
      id: appInfo.appUrl,
      link: appInfo.appUrl,
      image: appInfo.appLogoUrl,
      favicon: appInfo.appFaviconUrl,
      copyright: `2014-${new Date().getFullYear()} ${appInfo.appDomain}`,
      updated: new Date(),
      generator: appInfo.appDomain,
      feedLinks: {
        rss: `${appInfo.appUrl}/rss.xml`
      },
      webMaster: options['site_author']
    });

    posts.forEach((item) => {
      const post = item.post;
      feed.addItem({
        title: post.postTitle,
        id: post.postId,
        link: appInfo.appUrl + post.postGuid,
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
app.get('/wallpaper-rss.xml', async (req: Request, res: Response) => {
  try {
    const { page, size, lang } = req.query;
    const { data: appInfo } = await request(ApiUrl.TENANT_APP);
    const { data: options } = await request(ApiUrl.OPTION_FRONTEND);
    const { data: wallpaperList } = await request(ApiUrl.WALLPAPER_LIST, {
      page: Number(page) || 1,
      pageSize: Math.min(Number(size) || 10, 100)
    });
    const wallpapers: Wallpaper[] = wallpaperList.list || [];
    const feed = new Feed({
      title: appInfo.appName,
      description: appInfo.appDescription,
      language: 'zh-cn',
      dcExtension: true,
      id: appInfo.appUrl,
      link: appInfo.appUrl,
      image: appInfo.appLogoUrl,
      favicon: appInfo.appFaviconUrl,
      copyright: `2014-${new Date().getFullYear()} ${appInfo.appDomain}`,
      updated: new Date(),
      generator: appInfo.appDomain,
      feedLinks: {
        rss: `${appInfo.appUrl}/wallpaper-rss.xml`
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
        link: appInfo.appUrl + '/wallpaper/' + wallpaper.wallpaperId + langParam,
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
    const { data: appInfo } = await request(ApiUrl.TENANT_APP);
    const sitemap: SitemapData = (await request(ApiUrl.SITEMAP)).data;
    const sitemapStream = new SitemapStream({
      hostname: appInfo.appUrl
    });

    const links: SitemapItemLoose[] = [
      {
        url: appInfo.appUrl,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: appInfo.appUrl + '/post',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: appInfo.appUrl + '/wallpaper',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: appInfo.appUrl + '/post/archive',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 0.8
      },
      {
        url: appInfo.appUrl + '/wallpaper/archive',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 0.8
      },
      {
        url: appInfo.appUrl + TOOL_URL_ENTRY,
        changefreq: EnumChangefreq.WEEKLY,
        priority: 0.9
      }
    ];
    const pages: SitemapItemLoose[] = sitemap.posts
      .filter((item) => item.postType === PostType.PAGE)
      .map((item) => ({
        url: appInfo.appUrl + item.postGuid,
        changefreq: EnumChangefreq.DAILY,
        priority: 1,
        lastmod: new Date(item.postModified).toString()
      }));
    const posts: SitemapItemLoose[] = sitemap.posts
      .filter((item) => item.postType === PostType.POST)
      .map((item) => ({
        url: appInfo.appUrl + item.postGuid,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 0.9,
        lastmod: new Date(item.postModified).toString()
      }));
    const wallpapersCn: SitemapItemLoose[] = sitemap.wallpapers
      .filter((item) => !!item.bingIdCn)
      .map((item) => ({
        url: `${appInfo.appUrl}/wallpaper/${item.wallpaperId}`,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 0.9,
        lastmod: new Date(item.wallpaperModified).toString()
      }));
    const wallpapersEn: SitemapItemLoose[] = sitemap.wallpapers
      .filter((item) => !!item.bingIdEn)
      .map((item) => ({
        url: `${appInfo.appUrl}/wallpaper/${item.wallpaperId}?lang=en`,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 0.9,
        lastmod: new Date(item.wallpaperModified).toString()
      }));
    const postArchivesByMonth: SitemapItemLoose[] = sitemap.postArchives.map((item) => ({
      url: `${appInfo.appUrl}/post/archive/${item.dateValue}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const postArchivesByYear: SitemapItemLoose[] = uniq(
      sitemap.postArchives.map((item) => item.dateValue.split('/')[0])
    ).map((item) => ({
      url: `${appInfo.appUrl}/post/archive/${item}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const wallpaperArchivesByMonth: SitemapItemLoose[] = sitemap.wallpaperArchives.map((item) => ({
      url: `${appInfo.appUrl}/wallpaper/archive/${item.dateValue}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const wallpaperArchivesByYear: SitemapItemLoose[] = uniq(
      sitemap.wallpaperArchives.map((item) => item.dateValue.split('/')[0])
    ).map((item) => ({
      url: `${appInfo.appUrl}/wallpaper/archive/${item}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const tools: SitemapItemLoose[] = TOOL_LINKS.map((item) => ({
      url: appInfo.appUrl + item.url,
      changefreq: <EnumChangefreq>item.changefreq,
      priority: item.priority
    }));
    const taxonomies: SitemapItemLoose[] = sitemap.taxonomies.map((item) => ({
      url: `${appInfo.appUrl}/post/category/${item.taxonomySlug}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const tags: SitemapItemLoose[] = sitemap.tags.map((item) => ({
      url: `${appInfo.appUrl}/post/tag/${item.tagName}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));

    streamToPromise(
      <Readable>(
        Readable.from(
          links.concat(
            pages,
            posts,
            wallpapersCn,
            wallpapersEn,
            tools,
            taxonomies,
            tags,
            postArchivesByYear,
            postArchivesByMonth,
            wallpaperArchivesByYear,
            wallpaperArchivesByMonth
          )
        ).pipe(sitemapStream)
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
  const port = environment.port || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);
