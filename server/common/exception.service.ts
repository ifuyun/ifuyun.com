import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomException } from '../exceptions/custom.exception';
import { CustomExceptionResponse } from '../exceptions/exception.interface';
import { LogData } from '../logger/logger.interface';
import { LoggerService } from '../logger/logger.service';
import { HttpResponseEntity } from './http-response.interface';
import { Message } from './message.enum';

@Injectable()
export class ExceptionService {
  constructor(private readonly configService: ConfigService, private readonly logger: LoggerService) {}

  async handleException(
    exception: CustomException | HttpException | Error | unknown,
    visitor = ''
  ): Promise<{ resStatus: number; resData: HttpResponseEntity }> {
    const isDev = this.configService.get('env.isDev');
    // 返回给终端的响应数据
    let resData: HttpResponseEntity;
    let resStatus: number;

    if (exception instanceof CustomException) {
      const errRes = <CustomExceptionResponse>exception.getResponse();
      const errLog = errRes.log;
      resStatus = exception.getStatus();
      resData = errRes.data;

      if (errLog || resData) {
        if (isDev) {
          console.error(errLog || resData);
        } else {
          const shouldNotice = (resData.code >= 500 && resData.code < 600) || resData.code >= 10000;
          const logData: LogData = {
            message: (errLog ? errLog.message : '') || resData.message,
            data: (errLog ? errLog.data : null) || resData.data,
            visitor,
            stack: (shouldNotice && ((errLog ? errLog.stack : null) || exception.stack)) || ''
          };
          this.logger.error(logData);
        }
      }
    } else if (exception instanceof HttpException) {
      const errRes = <string | Record<string, any>>exception.getResponse();
      const msg =
        typeof errRes === 'string'
          ? errRes
          : errRes['message'] || errRes['error'] || exception.message || Message.UNKNOWN_ERROR;
      resStatus = exception.getStatus();
      resData = {
        code: resStatus,
        message: msg
      };
      const shouldNotice = (resStatus >= 500 && resStatus < 600) || resStatus >= 10000;
      const stack = shouldNotice && exception.stack;
      if (isDev) {
        console.error(stack);
      } else {
        const logData: LogData = {
          message: msg,
          visitor,
          stack: stack || ''
        };
        this.logger.error(logData);
      }
    } else {
      resStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      resData = {
        code: resStatus,
        message: Message.UNKNOWN_ERROR
      };
      if (exception instanceof Error) {
        resData.message = exception.message;
        if (isDev) {
          console.error(exception.stack);
        } else {
          const logData = {
            message: exception.message,
            visitor,
            stack: exception.stack
          };
          this.logger.error(logData);
        }
      }
    }

    return {
      resStatus,
      resData
    };
  }
}
