import { Injectable } from '@angular/core';
import { format, generateId } from 'common/utils';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiUrl } from './api-url';
import { ApiService } from './api.service';
import { AppConfigService } from './app-config.service';
import { LoginEntity, LoginResponse, SignupEntity } from './auth.interface';
import { COOKIE_KEY_USER_ID, COOKIE_KEY_USER_NAME, COOKIE_KEY_USER_TOKEN } from './common.constant';
import { HttpResponseEntity } from './http-response.interface';
import { OptionEntity } from './option.interface';
import { ResponseCode } from './response-code.enum';
import { SsrCookieService } from './ssr-cookie.service';
import { UserModel } from './user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private readonly apiService: ApiService,
    private readonly cookieService: SsrCookieService,
    private readonly appConfigService: AppConfigService
  ) {}

  login(payload: LoginEntity): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(
        ApiUrl.AUTH_LOGIN,
        {
          ...payload,
          appId: this.appConfigService.appId
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

  logout(): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(
        ApiUrl.AUTH_LOGOUT,
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

  signup(payload: SignupEntity): Observable<UserModel> {
    return this.apiService
      .httpPost(
        ApiUrl.AUTH_SIGNUP,
        {
          ...payload,
          appId: this.appConfigService.appId
        },
        true
      )
      .pipe(map((res) => res?.data || {}));
  }

  verify(userId: string, code: string): Observable<LoginResponse> {
    return this.apiService
      .httpPost(
        ApiUrl.AUTH_VERIFY,
        {
          userId,
          code,
          appId: this.appConfigService.appId
        },
        true
      )
      .pipe(
        map((res) => res?.data || {}),
        tap((res) => {
          if (res.token?.accessToken) {
            this.setAuth(res);
          }
        })
      );
  }

  sendCode(payload: { userId?: string; email?: string }): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(
        ApiUrl.AUTH_SEND_CODE,
        {
          ...payload,
          appId: this.appConfigService.appId
        },
        true
      )
      .pipe(map((res) => res || {}));
  }

  thirdLogin(authCode: string, source: string): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(
        ApiUrl.USER_THIRD_LOGIN,
        {
          authCode,
          source,
          appId: this.appConfigService.appId
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

  resetPassword(payload: { email: string; code: string; password: string }): Observable<LoginResponse> {
    return this.apiService
      .httpPost(
        ApiUrl.AUTH_RESET_PASSWORD,
        {
          ...payload,
          appId: this.appConfigService.appId
        },
        true
      )
      .pipe(map((res) => res?.data || {}));
  }

  getToken(): string {
    return this.cookieService.get(COOKIE_KEY_USER_TOKEN);
  }

  setAuth(authInfo: LoginResponse) {
    const { user, token } = authInfo;
    const options = {
      path: '/',
      domain: this.appConfigService.cookieDomain,
      expires: this.appConfigService.cookieExpires
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
    const thirdLoginApi: Record<string, string> = Object.freeze({
      wechat: '',
      qq: '',
      alipay:
        'https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?app_id=$0&scope=auth_user&redirect_uri=$1&state=$2',
      weibo: 'https://api.weibo.com/oauth2/authorize?client_id=$0&response_type=code&redirect_uri=$1&state=$2',
      github: 'https://github.com/login/oauth/authorize?client_id=$0&redirect_uri=$1&state=$2'
    });
    let url = '';

    switch (type) {
      case 'alipay':
        if (isMobile) {
          const authUrl = format(
            thirdLoginApi[type],
            options['open_alipay_app_id'],
            encodeURIComponent(this.getThirdLoginCallbackURL('m_alipay', ref, callbackUrl)),
            this.generateState(ref)
          );
          url = `alipays://platformapi/startapp?appId=20000067&url=${encodeURIComponent(authUrl)}`;
        } else {
          url = format(
            thirdLoginApi[type],
            options['open_alipay_app_id'],
            encodeURIComponent(this.getThirdLoginCallbackURL('alipay', ref, callbackUrl)),
            this.generateState(ref)
          );
        }
        break;
      case 'weibo':
        url = format(
          thirdLoginApi[type],
          options['open_weibo_app_key'],
          encodeURIComponent(this.getThirdLoginCallbackURL('weibo', ref, callbackUrl)),
          this.generateState(ref)
        );
        break;
      case 'github':
        url = format(
          thirdLoginApi[type],
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
}
