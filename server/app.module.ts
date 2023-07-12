import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AngularUniversalModule } from '@nestjs/ng-universal';
import { join } from 'path';
import { AppServerModule } from '../src/main.server';
import { ExceptionService } from './common/exception.service';
import APP_CONFIG from './config/app.config';
import ENV_CONFIG from './config/env.config';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { LoggerService } from './logger/logger.service';
import { RssModule } from './modules/rss/rss.module';
import { SitemapModule } from './modules/sitemap/sitemap.module';

@Module({
  imports: [
    AngularUniversalModule.forRoot({
      bootstrap: AppServerModule,
      viewsPath: join(process.cwd(), 'dist/browser'),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      errorHandler: () => {}
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(process.cwd(), `server/env/${process.env['ENV']}.env`),
      load: [ENV_CONFIG, APP_CONFIG]
    }),
    RssModule,
    SitemapModule
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter
    },
    ConfigService,
    LoggerService,
    ExceptionService
  ],
  controllers: []
})
export class AppModule {}
