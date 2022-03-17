import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiService } from '../core/api.service';
import { CommonService } from '../core/common.service';
import { PlatformService } from '../core/platform.service';
import { ApiUrl } from '../enums/api-url';
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
      tap((res) => this.setSession(res, loginData))
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
      try {
        return JSON.parse(<string>localStorage.getItem('token_expires')) || 0;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  }

  private setSession(authResult: LoginResponse, loginData: LoginEntity) {
    if (authResult.accessToken) {
      localStorage?.setItem('token', authResult.accessToken);
      localStorage?.setItem('token_expires', authResult.expiresAt.toString());
      if (loginData.rememberMe === true || loginData.rememberMe === '1') {
        this.cookieService.set('username', loginData.username, {
          path: '/',
          domain: environment.cookie.domain,
          expires: environment.cookie.expires
        });
        this.cookieService.set('rememberMe', '1', {
          path: '/',
          domain: environment.cookie.domain,
          expires: environment.cookie.expires
        });
      }
    }
  }

  logout() {
    // todo: must request to server: logout
    localStorage?.removeItem('token');
    localStorage?.removeItem('token_expires');
    this.cookieService.delete('username');
    this.cookieService.delete('rememberMe');
  }

  isLoggedIn() {
    // todo: warning: in client mode, should check token is valid, not only is existence.
    return !!this.getToken() && moment().isBefore(this.getExpiration());
  }

  isLoggedOut() {
    return !this.isLoggedIn();
  }
}
