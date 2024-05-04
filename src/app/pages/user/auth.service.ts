import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { CookieService } from 'ngx-cookie-service';
import { map, Observable, tap } from 'rxjs';
import { environment as env } from '../../../environments/environment';
import { ApiUrl } from '../../config/api-url';
import { APP_ID } from '../../config/common.constant';
import { ResponseCode } from '../../config/response-code.enum';
import { ApiService } from '../../core/api.service';
import { PlatformService } from '../../core/platform.service';
import { UserEntity, UserModel } from '../../interfaces/user.interface';
import { LoginEntity, LoginResponse } from './auth.interface';
import { HttpResponseEntity } from '../../core/http-response.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private apiService: ApiService,
    private platform: PlatformService,
    private readonly cookieService: CookieService
  ) {}

  login(loginData: LoginEntity): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.USER_LOGIN), loginData, false).pipe(
      map((res) => res || {}),
      tap((res) => this.setAuth(res.data))
    );
  }

  logout(): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.USER_LOGOUT), {}, false).pipe(
      tap((res) => {
        if (res.code === ResponseCode.SUCCESS) {
          this.clearAuth();
        }
      })
    );
  }

  register(user: UserEntity): Observable<UserModel> {
    return this.apiService
      .httpPost(this.apiService.getApiUrl(ApiUrl.USER_REGISTER), user, false)
      .pipe(map((res) => <any>(res?.data || {})));
  }

  verify(payload: { userId: string; code: string }): Observable<LoginResponse> {
    return this.apiService
      .httpPost(
        this.apiService.getApiUrl(ApiUrl.USER_VERIFY),
        {
          ...payload,
          appId: APP_ID
        },
        false
      )
      .pipe(
        map((res) => <any>(res?.data || '')),
        tap((res) => {
          this.setAuth(res);
        })
      );
  }

  resend(userId: string): Observable<UserModel> {
    return this.apiService
      .httpPost(
        this.apiService.getApiUrl(ApiUrl.USER_RESEND_CODE),
        {
          userId,
          appId: APP_ID
        },
        false
      )
      .pipe(map((res) => <any>(res?.data || {})));
  }

  getToken(): string {
    if (this.platform.isBrowser) {
      return localStorage.getItem('token') || '';
    }
    return '';
  }

  getExpiration() {
    if (this.platform.isBrowser) {
      return parseInt(localStorage.getItem('token_expires') || '', 10) || 0;
    }
    return 0;
  }

  clearAuth() {
    if (this.platform.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('token_expires');
    }
    this.cookieService.delete('user');
  }

  isLoggedIn(): boolean {
    // API层守卫会拦截失效、无效token，因此client不做进一步校验
    const isLoggedIn = !!this.getToken() && moment().isBefore(this.getExpiration());

    if (!isLoggedIn) {
      this.clearAuth();
      return false;
    }

    return true;
  }

  isLoggedOut(): boolean {
    return !this.isLoggedIn();
  }

  setAuth(authResult: LoginResponse) {
    if (authResult.token?.accessToken) {
      localStorage?.setItem('token', authResult.token.accessToken);
      localStorage?.setItem('token_expires', authResult.token.expiresAt.toString());

      this.cookieService.set('user', authResult.user.userNickname, {
        path: '/',
        domain: env.cookie.domain,
        expires: env.cookie.expires
      });
    }
  }
}
