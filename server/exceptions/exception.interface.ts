import { HttpResponseEntity } from '../common/http-response.interface';
import { HttpStatus } from '@nestjs/common';

export interface CustomExceptionLog {
  message?: string;
  data?: any;
  stack?: string;
}

export interface CustomExceptionResponse {
  status?: HttpStatus;
  data: HttpResponseEntity;
  log?: CustomExceptionLog;
}
