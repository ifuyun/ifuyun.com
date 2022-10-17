import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { CustomException } from '../exceptions/custom.exception';
import { getIPAndUserAgent } from '../helpers/request-parser';
import { ExceptionService } from '../common/exception.service';

@Catch()
export class AllExceptionsFilter<T> implements ExceptionFilter {
  constructor(private readonly exceptionService: ExceptionService) {}

  async catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();
    const visitorInfo = getIPAndUserAgent(req);
    const { resStatus, resData } = await this.exceptionService.handleException(
      exception as CustomException | HttpException | Error,
      visitorInfo
    );

    res.header('Content-Type', 'application/json').status(resStatus).json(resData);
  }
}
