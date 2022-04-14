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
      return parseInt(localStorage.getItem('token_expires') || '', 10) || 0;
    }
    return 0;
  }

  private setSession(authResult: LoginResponse, loginData: LoginEntity) {
    if (authResult.accessToken) {
      localStorage?.setItem('token', authResult.accessToken);
      localStorage?.setItem('token_expires', authResult.expiresAt.toString());
      if (loginData.rememberMe) {
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

  clearAuth() {
    localStorage?.removeItem('token');
    localStorage?.removeItem('token_expires');
  }

  logout() {
    // todo: must request to server: logout
    this.clearAuth();
  }

  isLoggedIn() {
    // todo: warning: in client mode, should check token is valid, not only is existence.
    const isLoggedIn = !!this.getToken() && moment().isBefore(this.getExpiration());

    if (!isLoggedIn) {
      this.clearAuth();
      return false;
    }

    return true;
  }

  isLoggedOut() {
    return !this.isLoggedIn();
  }
}
