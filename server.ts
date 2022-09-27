import { APP_BASE_HREF } from '@angular/common';
import { ngExpressEngine } from '@nguniversal/express-engine';
import * as compress from 'compression';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { existsSync } from 'fs';
import helmet from 'helmet';
import * as moment from 'moment';
import { join } from 'path';
import * as RSS from 'rss';
import 'zone.js/dist/zone-node';
import { ApiUrl } from './src/app/config/api-url';
import { SITE_INFO } from './src/app/config/constants';
import { Post } from './src/app/pages/post/post.interface';
import { environment as env } from './src/environments/environment';
import { fetchJson } from './src/fetch';
import { AppServerModule } from './src/main.server';

// The Express app is exported so that it can be used by serverless Functions.
export async function app(): Promise<express.Express> {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html')) ? 'index.original.html' : 'index';

  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
  server.engine('html', ngExpressEngine({
    bootstrap: AppServerModule
  }));

  server.set('view engine', 'html');
  server.set('views', distFolder);

  server.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
    dnsPrefetchControl: false,
    referrerPolicy: false
  }));
  server.use(compress());
  server.use(cookieParser(env.cookie.secret));
  server.enable('trust proxy');

  server.use((req, res, next) => {
    try {
      decodeURIComponent(req.path);
    } catch (e) {
      console.log(moment().format('YYYY-MM-DD HH:mm:ss'), req.url);
      console.error(e);
      return res.redirect('/404');
    }
    next();
  });

  server.get('/rss.xml', async (req, res) => {
    const paramPage = typeof req.query['page'] === 'string' ? req.query['page'] : '';
    const paramSize = typeof req.query['size'] === 'string' ? req.query['size'] : '';
    const page = Math.max(parseInt(paramPage, 10) || 1, 1);
    // between 1 and 100
    const size = Math.max(Math.min(parseInt(paramSize, 10) || 10, 100), 1);
    const detail = req.query['detail'] === '1' ? 1 : 0;
    const apiUrl = `${ApiUrl.API_URL_PREFIX}${ApiUrl.GET_POSTS}?page=${page}&pageSize=${size}&detail=${detail}`;
    try {
      const result = await fetchJson(apiUrl);
      const posts: Post[] = result.data.postList.posts || [];
      const feed = new RSS({
        title: SITE_INFO.title,
        description: SITE_INFO.slogan,
        generator: SITE_INFO.domain,
        feed_url: `${SITE_INFO.url}/rss.xml`,
        site_url: SITE_INFO.url,
        image_url: `${SITE_INFO.url}/logo.png`,
        managingEditor: SITE_INFO.author,
        webMaster: SITE_INFO.author,
        copyright: `${SITE_INFO.startYear}-${new Date().getFullYear()} ${SITE_INFO.domain}`,
        language: 'zh-cn',
        pubDate: new Date(),
        ttl: 60
      });
      posts.forEach((item) => {
        const post = item.post;
        feed.item({
          title: post.postTitle,
          description: detail ? post.postContent : post.postExcerpt,
          url: SITE_INFO.url + post.postGuid,
          guid: post.postId,
          categories: item.categories.map((category) => category.taxonomySlug),
          author: item.meta['post_author'] || post.author.userNiceName,
          date: post.postDate
        });
      });
      const xmlData = feed.xml({ indent: true });
      res.status(200).header('Content-Type', 'text/xml').send(xmlData);
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e.message || 'Request Failed.'
      });
    }
  });

  // Serve static files from /browser
  server.get('*.*', express.static(distFolder, {
    maxAge: '1y'
  }));

  // All regular routes use the Universal engine
  server.get('*', (req, res) => {
    res.render(indexHtml, {
      req,
      res,
      providers: [
        { provide: APP_BASE_HREF, useValue: req.baseUrl }
      ]
    }, (error: Error, html: string) => {
      if (error) {
        res.status(res.statusCode).send(error);
      } else if (!res.headersSent) {
        res.send(html);
      }
    });
  });

  return server;
}

function run() {
  const port = env.server.port || 4000;

  // Start up the Node server
  app().then((server) => {
    server.listen(port, () => {
      console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}]ifuyun.com listening on http://localhost:${port}`);
    });
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = mainModule && mainModule.filename || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export * from './src/main.server';
