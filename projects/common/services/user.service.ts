import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService, HttpResponseEntity, UserModel } from 'common/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

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

  constructor(
    private readonly apiService: ApiService,
    private readonly appConfigService: AppConfigService
  ) {}

  getLoginUser(): Observable<UserModel> {
    return this.apiService
      .httpGet(ApiUrl.USER_LOGIN_INFO, {
        appId: this.appConfigService.appId
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
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }

  thirdLogin(authCode: string, source: string): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.USER_THIRD_LOGIN, {
      authCode,
      source,
      appId: this.appConfigService.appId
    });
  }
}
