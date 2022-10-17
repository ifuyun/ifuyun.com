import { ResponseCode } from './response-code.enum';

export interface HttpResponseEntity {
  code: ResponseCode;
  message?: string;
  data?: any;
}
