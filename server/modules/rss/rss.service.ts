import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { ApiUrl } from '../../../src/app/config/api-url';
import { ResultList } from '../../../src/app/core/common.interface';
import { Post } from '../../../src/app/pages/post/post.interface';
import { HttpResponseEntity } from '../../common/http-response.interface';
import { ResponseCode } from '../../common/response-code.enum';
import { InternalServerErrorException } from '../../exceptions/internal-server-error.exception';

@Injectable()
export class RssService {
  constructor(private readonly httpService: HttpService, private readonly configService: ConfigService) {}

  async getPosts(page: number, pageSize: number, detail: boolean): Promise<{ postList: ResultList<Post> }> {
    const apiUrl = this.configService.get('app.api.host') + ApiUrl.API_URL_PREFIX + ApiUrl.GET_POSTS;
    const apiParam = `?page=${page}&pageSize=${pageSize}&detail=${detail ? '1' : '0'}`;
    let response: HttpResponseEntity;
    try {
      response = (await lastValueFrom(this.httpService.get(apiUrl + apiParam))).data;
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
