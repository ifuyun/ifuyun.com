import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiUrl } from '../config/api-url';
import { APP_ID } from '../config/common.constant';
import { HttpResponseEntity } from '../interfaces/http-response';
import { UserModel } from '../interfaces/user';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private user: BehaviorSubject<UserModel> = new BehaviorSubject<UserModel>({
    userId: '',
    userNickname: '',
    appId: ''
  });
  user$: Observable<UserModel> = this.user.asObservable();

  constructor(private readonly apiService: ApiService) {}

  getLoginUser(): Observable<UserModel> {
    return this.apiService
      .httpGet(ApiUrl.USER_LOGIN_INFO, {
        appId: APP_ID
      })
      .pipe(
        map((res) => res?.data || {}),
        tap((user) => this.user.next(user))
      );
  }

  getSignupUser(userId: string): Observable<UserModel> {
    return this.apiService
      .httpGet(ApiUrl.USER_SIGNUP_INFO, {
        userId,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }

  thirdLogin(authCode: string, source: string): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.USER_THIRD_LOGIN, {
      authCode,
      source,
      appId: APP_ID
    });
  }
}
