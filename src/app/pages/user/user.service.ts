import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { ApiUrl } from '../../config/api-url';
import { APP_ID, STORAGE_KEY_USER } from '../../config/common.constant';
import { ApiService } from '../../core/api.service';
import { CommonService } from '../../core/common.service';
import { HttpResponseEntity } from '../../core/http-response.interface';
import { format, generateId } from '../../helpers/helper';
import { OptionEntity } from '../../interfaces/option.interface';
import { TenantAppModel } from '../../interfaces/tenant-app.interface';
import { Guest, UserModel } from '../../interfaces/user.interface';
import { THIRD_LOGIN_API, THIRD_LOGIN_CALLBACK } from './user.constant';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private loginUser: BehaviorSubject<UserModel> = new BehaviorSubject<UserModel>({
    appId: '',
    userId: '',
    userNickname: ''
  });
  loginUser$: Observable<UserModel> = this.loginUser.asObservable();

  constructor(
    private apiService: ApiService,
    private commonService: CommonService
  ) {}

  getLoginUser(): Observable<UserModel> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.USER_LOGIN_INFO), {
        appId: APP_ID
      })
      .pipe(
        map((res) => res?.data || {}),
        tap((user) => this.loginUser.next(user))
      );
  }

  getRegisterUser(userId: string): Observable<UserModel> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.USER_REGISTER_INFO), {
        userId,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }

  getCommentUser(): Guest | null {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_USER) || '');
    } catch (e) {
      return null;
    }
  }

  thirdLogin(authCode: string, source: string): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.USER_THIRD_LOGIN), {
      authCode,
      source,
      appId: APP_ID
    });
  }

  gotoLogin(loginURL: string, isReplace = true) {
    if (isReplace) {
      location.replace(loginURL);
    } else {
      location.href = loginURL;
    }
  }

  getThirdLoginCallbackURL(channel: string, appInfo: TenantAppModel, ref: string) {
    return this.commonService.getURL(format(THIRD_LOGIN_CALLBACK, channel, ref), appInfo);
  }

  getThirdLoginURL(param: {
    type: string;
    options: OptionEntity;
    appInfo: TenantAppModel;
    ref: string;
    isMobile: boolean;
  }) {
    const { type, options, appInfo, ref, isMobile } = param;
    let url = '';
    switch (type) {
      case 'alipay':
        if (isMobile) {
          const authUrl = format(
            THIRD_LOGIN_API[type],
            options['open_alipay_app_id'],
            encodeURIComponent(this.getThirdLoginCallbackURL('m_alipay', appInfo, ref)),
            generateId()
          );
          url = `alipays://platformapi/startapp?appId=20000067&url=${encodeURIComponent(authUrl)}`;
        } else {
          url = format(
            THIRD_LOGIN_API[type],
            options['open_alipay_app_id'],
            encodeURIComponent(this.getThirdLoginCallbackURL('alipay', appInfo, ref)),
            generateId()
          );
        }
        break;
      case 'weibo':
        url = format(
          THIRD_LOGIN_API[type],
          options['open_weibo_app_key'],
          encodeURIComponent(this.getThirdLoginCallbackURL('weibo', appInfo, ref))
        );
        break;
      case 'github':
        url = format(
          THIRD_LOGIN_API[type],
          options['open_github_client_id'],
          encodeURIComponent(this.getThirdLoginCallbackURL('github', appInfo, ref)),
          generateId()
        );
    }

    return url;
  }
}
