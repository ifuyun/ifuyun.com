import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { ApiUrl } from '../../../src/app/config/api-url';
import { APP_ID } from '../../../src/app/config/common.constant';
import { HttpResponseEntity } from '../../common/http-response.interface';
import { ResponseCode } from '../../common/response-code.enum';
import { InternalServerErrorException } from '../../exceptions/internal-server-error.exception';

@Injectable()
export class OptionService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  async getOptions(): Promise<Record<string, string>> {
    const apiUrl = this.configService.get('app.api.host') + ApiUrl.API_URL_PREFIX + ApiUrl.OPTION_FRONTEND;
    let response: HttpResponseEntity;
    try {
      response = (await lastValueFrom(this.httpService.get(apiUrl + '?appId=' + APP_ID))).data;
    } catch (e) {
      response = {
        code: ResponseCode.INTERNAL_SERVER_ERROR
      };
    }
    if (response.code !== ResponseCode.SUCCESS) {
      throw new InternalServerErrorException();
    }
    return response.data;
  }
}
