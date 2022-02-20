import { APP_BASE_HREF } from '@angular/common';
import { ngExpressEngine } from '@nguniversal/express-engine';
import * as express from 'express';
import * as csrf from 'csurf';
import * as compress from 'compression';
import * as connectRedis from 'connect-redis';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { existsSync } from 'fs';
import { join } from 'path';
import { createClient } from 'redis';
import 'zone.js/dist/zone-node';
import { AppServerModule } from './src/main.server';
import { environment as env } from './src/environments/environment';

// The Express app is exported so that it can be used by serverless Functions.
export async function app(): Promise<express.Express> {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/ifuyun.com/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html')) ? 'index.original.html' : 'index';

  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
  server.engine('html', ngExpressEngine({
    bootstrap: AppServerModule
  }));

  server.set('view engine', 'html');
  server.set('views', distFolder);

  server.use(compress());
  server.use(cookieParser(env.cookie.secret));
  server.use(csrf({ cookie: { key: 'XSRF' } }));

  const redisClient = createClient({
    url: `redis://:${env.redis.password}@${env.redis.host}:${env.redis.port}`,
    legacyMode: true
  });
  // todo: log
  await redisClient.connect().catch((err) => console.log(`Redis Client Error: ${err.message}`));
  const RedisStore = connectRedis(session);
  server.use(session({
    name: env.session.key,
    store: new RedisStore({
      // @ts-ignore
      client: redisClient,
      ttl: 7 * 24 * 60 * 60
    }),
    secret: env.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: env.cookie.expires * 24 * 60 * 60 * 1000
    }
  }));

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
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
        { provide: APP_BASE_HREF, useValue: req.baseUrl },
        { provide: 'REQUEST', useValue: req },
        { provide: 'RESPONSE', useValue: res }
      ]
    });
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  app().then((server) => {
    server.listen(port, () => {
      console.log(`Node Express server listening on http://localhost:${port}`);
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
