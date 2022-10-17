import { HttpStatus } from '@nestjs/common';
import { Message } from '../common/message.enum';
import { ResponseCode } from '../common/response-code.enum';
import { CustomExceptionResponse } from './exception.interface';
import { CustomException } from './custom.exception';

export class NotFoundException extends CustomException {
  constructor(
    message: Message | CustomExceptionResponse = Message.NOT_FOUND,
    resCode: ResponseCode = ResponseCode.NOT_FOUND,
    httpStatus: HttpStatus = HttpStatus.NOT_FOUND
  ) {
    super(message, httpStatus, resCode);
  }
}
