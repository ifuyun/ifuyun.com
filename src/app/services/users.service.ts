import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from '../core/base-api.service';
import { ApiUrl } from '../enums/api-url';
import { LoginUserEntity } from '../interfaces/users';

@Injectable({
  providedIn: 'root'
})
export class UsersService extends BaseApiService {
  constructor(
    protected http: HttpClient,
    protected message: NzMessageService
  ) {
    super();
  }

  getLoginUser(): Observable<LoginUserEntity> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_LOGIN_USER)).pipe(
      map((res) => res.data || {})
    );
  }
}
