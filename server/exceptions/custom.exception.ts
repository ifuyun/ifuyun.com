import { HttpException, HttpStatus } from '@nestjs/common';
import { ResponseCode } from '../common/response-code.enum';
import { CustomExceptionResponse } from './exception.interface';

export class CustomException extends HttpException {
  constructor(
    response: string | CustomExceptionResponse,
    httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    resCode: ResponseCode = ResponseCode.UNKNOWN_ERROR
  ) {
    let res: CustomExceptionResponse;
    if (typeof response === 'string') {
      // 快捷方式，传参数列表，不带log信息
      res = {
        data: {
          code: resCode,
          message: response
        }
      };
    } else {
      // 参数为对象
      res = response;
      httpStatus = res.status || httpStatus;
    }
    super(res, httpStatus);
  }
}
