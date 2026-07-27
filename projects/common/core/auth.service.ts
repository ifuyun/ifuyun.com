import { Injectable } from '@angular/core';
import { format, generateId } from 'common/utils';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiUrl } from './api-url';
import { ApiService } from './api.service';
import { AppConfigService } from './app-config.service';
import { SigninDto, SigninResponse, SignupDto } from './auth.interface';
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

  signin(payload: SigninDto): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.AUTH_SIGNIN, payload, true).pipe(
      map((res) => res || {}),
      tap((res) => {
        if (res.data?.token?.token) {
          this.setAuth(res.data);
        }
      })
    );
  }

  signout(): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(
        ApiUrl.AUTH_SIGNOUT,
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

  signup(payload: SignupDto): Observable<UserModel> {
    return this.apiService.httpPost(ApiUrl.AUTH_SIGNUP, payload, true).pipe(map((res) => res?.data || {}));
  }

  verify(id: string, code: string): Observable<SigninResponse> {
    return this.apiService
      .httpPost(
        ApiUrl.AUTH_VERIFY,
        {
          id,
          code
        },
        true
      )
      .pipe(
        map((res) => res?.data || {}),
        tap((res) => {
          if (res.token?.token) {
            this.setAuth(res);
          }
        })
      );
  }

  sendCode(payload: { id?: string; email?: string }): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.AUTH_SEND_CODE, payload, true).pipe(map((res) => res || {}));
  }

  oauthSignin(authCode: string, source: string): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(
        ApiUrl.AUTH_OAUTH,
        {
          authCode,
          source
        },
        false
      )
      .pipe(
        map((res) => res || {}),
        tap((res) => {
          if (res.data?.token?.token) {
            this.setAuth(res.data);
          }
        })
      );
  }

  resetPassword(payload: { email: string; code: string; password: string }): Observable<SigninResponse> {
    return this.apiService.httpPost(ApiUrl.AUTH_RESET_PASSWORD, payload, true).pipe(map((res) => res?.data || {}));
  }

  getToken(): string {
    return this.cookieService.get(COOKIE_KEY_USER_TOKEN);
  }

  setAuth(authInfo: SigninResponse) {
    const { user, token } = authInfo;
    const options = {
      path: '/',
      domain: this.appConfigService.cookieDomain,
      expires: this.appConfigService.cookieExpires
    };

    this.cookieService.set(COOKIE_KEY_USER_ID, user.userId, options);
    this.cookieService.set(COOKIE_KEY_USER_NAME, user.nickname, options);
    this.cookieService.set(COOKIE_KEY_USER_TOKEN, token.token, options);
  }

  clearAuth() {
    this.cookieService.delete(COOKIE_KEY_USER_TOKEN);
  }

  getOauthURL(param: { type: string; ref: string; options: OptionEntity; callbackUrl: string; isMobile: boolean }) {
    const { type, ref, options, callbackUrl, isMobile } = param;
    const oauthApi: Record<string, string> = Object.freeze({
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
            oauthApi[type],
            options['open_alipay_app_id'],
            encodeURIComponent(this.getOauthCallbackURL('m_alipay', ref, callbackUrl)),
            this.generateState(ref)
          );
          url = `alipays://platformapi/startapp?appId=20000067&url=${encodeURIComponent(authUrl)}`;
        } else {
          url = format(
            oauthApi[type],
            options['open_alipay_app_id'],
            encodeURIComponent(this.getOauthCallbackURL('alipay', ref, callbackUrl)),
            this.generateState(ref)
          );
        }
        break;
      case 'weibo':
        url = format(
          oauthApi[type],
          options['open_weibo_app_key'],
          encodeURIComponent(this.getOauthCallbackURL('weibo', ref, callbackUrl)),
          this.generateState(ref)
        );
        break;
      case 'github':
        url = format(
          oauthApi[type],
          options['open_github_client_id'],
          encodeURIComponent(this.getOauthCallbackURL('github', ref, callbackUrl)),
          this.generateState(ref)
        );
    }

    return url;
  }

  getOauthCallbackURL(channel: string, ref: string, callbackUrl: string) {
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
