import { APP_BASE_HREF } from '@angular/common';
import { ngExpressEngine } from '@nguniversal/express-engine';
import * as compress from 'compression';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { existsSync } from 'fs';
import helmet from 'helmet';
import { join } from 'path';
import 'zone.js/dist/zone-node';
import { environment as env } from './src/environments/environment';
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
    dnsPrefetchControl: false
  }));
  server.use(compress());
  server.use(cookieParser(env.cookie.secret));
  server.enable('trust proxy');

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
