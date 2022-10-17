import { HttpStatus } from '@nestjs/common';
import { Message } from '../common/message.enum';
import { ResponseCode } from '../common/response-code.enum';
import { CustomException } from './custom.exception';

export class UnknownException extends CustomException {
  constructor(
    message = Message.UNKNOWN_ERROR,
    resCode: ResponseCode = ResponseCode.UNKNOWN_ERROR,
    httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
  ) {
    super(message, httpStatus, resCode);
  }
}
