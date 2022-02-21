import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable } from 'rxjs';
import { BaseApiService } from '../core/base-api.service';
import { ApiUrl } from '../enums/api-url';

@Injectable({
  providedIn: 'root'
})
export class PostsService extends BaseApiService {
  constructor(
    protected http: HttpClient,
    protected message: NzMessageService
  ) {
    super();
  }

  getPosts(): Observable<any> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_POSTS));
  }
}
