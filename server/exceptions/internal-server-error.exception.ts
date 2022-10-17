import { HttpStatus } from '@nestjs/common';
import { Message } from '../common/message.enum';
import { ResponseCode } from '../common/response-code.enum';
import { CustomExceptionResponse } from './exception.interface';
import { CustomException } from './custom.exception';

export class InternalServerErrorException extends CustomException {
  constructor(
    message: Message | CustomExceptionResponse = Message.INTERNAL_SERVER_ERROR,
    resCode: ResponseCode = ResponseCode.INTERNAL_SERVER_ERROR,
    httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
  ) {
    super(message, httpStatus, resCode);
  }
}
