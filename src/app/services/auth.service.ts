import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiUrl } from '../config/api-url';
import { ApiService } from '../core/api.service';
import { PlatformService } from '../core/platform.service';
import { LoginEntity, LoginResponse } from '../interfaces/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private apiService: ApiService,
    private platform: PlatformService,
    private readonly cookieService: CookieService
  ) {
  }

  login(loginData: LoginEntity): Observable<LoginResponse> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.LOGIN), loginData).pipe(
      map((res) => res?.data || {}),
      tap((res) => this.setAuth(res, loginData))
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
    localStorage?.removeItem('token');
    localStorage?.removeItem('token_expires');
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

  logout() {
    // todo: destroy token in server side
    this.clearAuth();
  }

  private setAuth(authResult: LoginResponse, loginData: LoginEntity) {
    if (authResult.accessToken) {
      localStorage?.setItem('token', authResult.accessToken);
      localStorage?.setItem('token_expires', authResult.expiresAt.toString());
      if (loginData.rememberMe) {
        this.cookieService.set('user', loginData.username, {
          path: '/',
          domain: environment.cookie.domain,
          expires: environment.cookie.expires
        });
        this.cookieService.set('remember', '1', {
          path: '/',
          domain: environment.cookie.domain,
          expires: environment.cookie.expires
        });
      }
    }
  }
}
