import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { configure, getLogger, Logger } from 'log4js';
import * as moment from 'moment';
import { LogData } from './logger.interface';

@Injectable()
export class LoggerService {
  private logger: Logger;

  constructor(private readonly configService: ConfigService) {
    const appenders = {
      system: {
        type: 'multiFile',
        base: 'logs/system',
        extension: '.log',
        property: 'logDay',
        compress: false, // backup files will have .gz extension
        maxLogSize: 10485760, // 10MB
        backups: 10 // 默认5
      }
    };
    const categories = {
      default: {
        appenders: ['system'],
        level: configService.get('app.logLevel')
      }
    };
    configure({
      pm2: false,
      pm2InstanceVar: 'NEST_APP_INSTANCE',
      disableClustering: false,
      appenders,
      categories
    });

    this.logger = getLogger('system');
    this.logger.addContext('logDay', moment().format('YYYY-MM-DD'));
  }

  @Cron('0 0 * * *', {
    name: 'updateLoggerContext'
  })
  updateContext() {
    const today = moment().format('YYYY-MM-DD');
    this.logger.clearContext();
    this.logger.addContext('logDay', today);
  }

  transformLogData(logData: string | LogData, ...args: any[]): Array<string | LogData> {
    if (args.length > 0) {
      return [logData, ...args];
    }
    let logStr = '';
    if (typeof logData === 'string') {
      logStr = `[Msg] ${logData}`;
    } else {
      logStr += logData.message ? `[Msg] ${logData.message}` : '';
      logStr += logData.url ? (logStr ? '\n' : '') + `[URL] ${logData.url}` : '';
      logStr += logData.data ? (logStr ? '\n' : '') + `[Data] ${JSON.stringify(logData.data)}` : '';
      logStr += logData.visitor ? (logStr ? '\n' : '') + `[User] ${logData.visitor}` : '';
      logStr += logData.stack ? (logStr ? '\n' : '') + `[Stack] ${logData.stack}` : '';
    }

    return [logStr];
  }

  trace(logData: string | LogData, ...args: any[]) {
    this.logger.trace.call(this.logger, ...this.transformLogData(logData, ...args));
  }

  debug(logData: string | LogData, ...args: any[]) {
    this.logger.debug.call(this.logger, ...this.transformLogData(logData, ...args));
  }

  info(logData: string | LogData, ...args: any[]) {
    this.logger.info.call(this.logger, ...this.transformLogData(logData, ...args));
  }

  warn(logData: string | LogData, ...args: any[]) {
    this.logger.warn.call(this.logger, ...this.transformLogData(logData, ...args));
  }

  error(logData: string | LogData, ...args: any[]) {
    this.logger.error.call(this.logger, ...this.transformLogData(logData, ...args));
  }

  fatal(logData: string | LogData, ...args: any[]) {
    this.logger.fatal.call(this.logger, ...this.transformLogData(logData, ...args));
  }

  mark(logData: string | LogData, ...args: any[]) {
    this.logger.mark.call(this.logger, ...this.transformLogData(logData, ...args));
  }
}
