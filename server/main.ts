import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cluster from 'cluster';
import * as compress from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { getWorkerCount } from './helpers/helper';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.select(AppModule).get(ConfigService, { strict: true });
  const logger = app.select(AppModule).get(LoggerService, { strict: true });
  const isCluster = config.get('env.isCluster');
  const { transformLogData } = logger;
  if ((cluster as any).isPrimary && isCluster) {
    const workerSize = getWorkerCount();
    for (let cpuIdx = 0; cpuIdx < workerSize; cpuIdx += 1) {
      (cluster as any).fork();
    }

    (cluster as any).on('exit', (worker: { process: { pid: any } }, code: any, signal: any) => {
      logger.error(
        transformLogData({
          message: `Worker ${worker.process.pid} exit.`,
          data: {
            code,
            signal
          }
        })[0]
      );
      process.nextTick(() => {
        logger.info(transformLogData({ message: 'New process is forking...' })[0]);
        (cluster as any).fork();
      });
    });
  } else {
    app.use(compress());
    app.use(cookieParser(config.get('app.cookieSecret')));
    app.enable('trust proxy');
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        originAgentCluster: false,
        dnsPrefetchControl: false,
        referrerPolicy: false
      })
    );

    const port = process.env['PORT'] || config.get('app.port') || 2008;
    const host = config.get('app.host', 'localhost');
    await app.listen(port, host, () => {
      logger.info(`Server listening on: ${host}:${port}`);
    });
  }
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = (mainModule && mainModule.filename) || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  bootstrap().catch((err) => console.error(err));
}
