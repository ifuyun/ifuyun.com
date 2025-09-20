import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService, URL_AVATAR_API, UserModel } from 'common/core';
import { UserLlmStatus } from 'common/enums';
import { format } from 'common/utils';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private user: BehaviorSubject<UserModel> = new BehaviorSubject<UserModel>({
    userId: '',
    userNickname: '',
    permissions: [],
    userLlmStatus: UserLlmStatus.DISABLED,
    userLlmModels: [],
    userLlmExpiresAt: 0,
    userLlmLimit: 0,
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

  getUserAvatar(user: UserModel, avatarType: string): string {
    let avatar: string;
    if (user.userAvatar) {
      avatar = user.userAvatar;
    } else {
      avatar = user.userEmailHash
        ? format(URL_AVATAR_API, user.userEmailHash, avatarType || 'monsterid')
        : this.appConfigService.faviconUrl;
    }
    return avatar;
  }
}
