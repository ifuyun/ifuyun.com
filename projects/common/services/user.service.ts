import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService, URL_AVATAR_API, UserModel } from 'common/core';
import { UserAiStatus } from 'common/enums';
import { format } from 'common/utils';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private user: BehaviorSubject<UserModel> = new BehaviorSubject<UserModel>({
    id: '',
    nickname: '',
    permissions: [],
    aiStatus: UserAiStatus.DISABLED,
    aiModels: [],
    aiExpiresAt: 0,
    aiLimit: 0,
    appId: ''
  });
  user$: Observable<UserModel> = this.user.asObservable();

  constructor(
    private readonly apiService: ApiService,
    private readonly appConfigService: AppConfigService
  ) {}

  getProfile(): Observable<UserModel> {
    return this.apiService
      .httpGet(ApiUrl.USER_PROFILE, {
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
    if (user.avatarUrl) {
      avatar = user.avatarUrl;
    } else {
      avatar = user.emailHash
        ? format(URL_AVATAR_API, user.emailHash, avatarType || 'monsterid')
        : this.appConfigService.faviconUrl;
    }
    return avatar;
  }
}
