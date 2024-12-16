import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiUrl } from '../config/api-url';
import { APP_ID, COOKIE_KEY_USER_ID, COOKIE_KEY_USER_NAME, COOKIE_KEY_USER_TOKEN } from '../config/common.constant';
import { ResponseCode } from '../config/response-code.enum';
import { LoginEntity, LoginResponse, SignupEntity } from '../interfaces/auth';
import { HttpResponseEntity } from '../interfaces/http-response';
import { OptionEntity } from '../interfaces/option';
import { UserModel } from '../interfaces/user';
import { THIRD_LOGIN_API } from '../pages/auth/auth.constant';
import { format, generateId } from '../utils/helper';
import { ApiService } from './api.service';
import { SsrCookieService } from './ssr-cookie.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private readonly apiService: ApiService,
    private readonly cookieService: SsrCookieService
  ) {}

  login(payload: LoginEntity): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(
        ApiUrl.USER_LOGIN,
        {
          ...payload,
          appId: APP_ID
        },
        true
      )
      .pipe(
        map((res) => res || {}),
        tap((res) => {
          if (res.data?.token?.accessToken) {
            this.setAuth(res.data);
          }
        })
      );
  }

  signup(payload: SignupEntity): Observable<UserModel> {
    return this.apiService
      .httpPost(
        ApiUrl.USER_SIGNUP,
        {
          ...payload,
          appId: APP_ID
        },
        true
      )
      .pipe(map((res) => <any>(res?.data || {})));
  }

  verify(userId: string, code: string): Observable<LoginResponse> {
    return this.apiService
      .httpPost(
        ApiUrl.USER_VERIFY,
        {
          userId,
          code,
          appId: APP_ID
        },
        true
      )
      .pipe(
        map((res) => <any>(res?.data || {})),
        tap((res) => {
          if (res.token?.accessToken) {
            this.setAuth(res);
          }
        })
      );
  }

  resend(userId: string): Observable<UserModel> {
    return this.apiService
      .httpPost(
        ApiUrl.USER_RESEND_CODE,
        {
          userId,
          appId: APP_ID
        },
        true
      )
      .pipe(map((res) => <any>(res?.data || {})));
  }

  thirdLogin(authCode: string, source: string): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(
        ApiUrl.USER_THIRD_LOGIN,
        {
          authCode,
          source,
          appId: APP_ID
        },
        false
      )
      .pipe(
        map((res) => res || {}),
        tap((res) => {
          if (res.data?.token?.accessToken) {
            this.setAuth(res.data);
          }
        })
      );
  }

  getToken(): string {
    return this.cookieService.get(COOKIE_KEY_USER_TOKEN);
  }

  setAuth(authInfo: LoginResponse) {
    const { user, token } = authInfo;
    const options = {
      path: '/',
      domain: environment.cookie.domain,
      expires: environment.cookie.expires
    };

    this.cookieService.set(COOKIE_KEY_USER_ID, user.userId, options);
    this.cookieService.set(COOKIE_KEY_USER_NAME, user.userNickname, options);
    this.cookieService.set(COOKIE_KEY_USER_TOKEN, token.accessToken, options);
  }

  clearAuth() {
    this.cookieService.delete(COOKIE_KEY_USER_TOKEN);
  }

  getThirdLoginURL(param: {
    type: string;
    ref: string;
    options: OptionEntity;
    callbackUrl: string;
    isMobile: boolean;
  }) {
    const { type, ref, options, callbackUrl, isMobile } = param;
    let url = '';

    switch (type) {
      case 'alipay':
        if (isMobile) {
          const authUrl = format(
            THIRD_LOGIN_API[type],
            options['open_alipay_app_id'],
            encodeURIComponent(this.getThirdLoginCallbackURL('m_alipay', ref, callbackUrl)),
            this.generateState(ref)
          );
          url = `alipays://platformapi/startapp?appId=20000067&url=${encodeURIComponent(authUrl)}`;
        } else {
          url = format(
            THIRD_LOGIN_API[type],
            options['open_alipay_app_id'],
            encodeURIComponent(this.getThirdLoginCallbackURL('alipay', ref, callbackUrl)),
            this.generateState(ref)
          );
        }
        break;
      case 'weibo':
        url = format(
          THIRD_LOGIN_API[type],
          options['open_weibo_app_key'],
          encodeURIComponent(this.getThirdLoginCallbackURL('weibo', ref, callbackUrl)),
          this.generateState(ref)
        );
        break;
      case 'github':
        url = format(
          THIRD_LOGIN_API[type],
          options['open_github_client_id'],
          encodeURIComponent(this.getThirdLoginCallbackURL('github', ref, callbackUrl)),
          this.generateState(ref)
        );
    }

    return url;
  }

  getThirdLoginCallbackURL(channel: string, ref: string, callbackUrl: string) {
    callbackUrl = callbackUrl.replace('{from}', channel);
    if (channel === 'github') {
      return callbackUrl.replace('{ref}', '');
    }
    return callbackUrl.replace('{ref}', encodeURIComponent(ref));
  }

  generateState(ref: string) {
    const stateData = {
      ref: ref ? encodeURIComponent(ref) : '',
      stateId: generateId()
    };

    return btoa(JSON.stringify(stateData));
  }

  logout(): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(
        ApiUrl.USER_LOGOUT,
        {
          referer: location.href
        },
        false
      )
      .pipe(
        tap((res) => {
          if (res.code === ResponseCode.SUCCESS) {
            this.clearAuth();
          }
        })
      );
  }
}
