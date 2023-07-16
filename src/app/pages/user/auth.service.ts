import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { CookieService } from 'ngx-cookie-service';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiUrl } from '../../config/api-url';
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
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.LOGIN), loginData).pipe(
      map((res) => res || {}),
      tap((res) => this.setAuth(res.data, loginData))
    );
  }

  logout(): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.LOGOUT)).pipe(
      tap((res) => {
        if (res.code === ResponseCode.SUCCESS) {
          this.clearAuth();
        }
      })
    );
  }

  register(user: UserEntity): Observable<UserModel> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.REGISTER), user).pipe(
      map((res) => <any>(res?.data || {}))
    );
  }

  verify(payload: { userId: string; code: string }): Observable<LoginResponse> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.VERIFY_USER), payload).pipe(
      map((res) => <any>(res?.data || '')),
      tap((res) => {
        this.setAuth(res);
      })
    );
  }

  resend(userId: string): Observable<UserModel> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.RESEND_CODE), { userId }).pipe(
      map((res) => <any>(res?.data || {}))
    );
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

  setAuth(authResult: LoginResponse, loginData?: LoginEntity) {
    if (authResult?.accessToken) {
      localStorage?.setItem('token', authResult.accessToken);
      localStorage?.setItem('token_expires', authResult.expiresAt.toString());
      if (loginData?.username) {
        this.cookieService.set('user', loginData.username, {
          path: '/',
          domain: environment.cookie.domain,
          expires: environment.cookie.expires
        });
      }
    }
  }
}
