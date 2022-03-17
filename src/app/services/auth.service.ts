import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { REQUEST, RESPONSE } from '@nguniversal/express-engine/tokens';
import { Request, Response } from 'express';
import * as moment from 'moment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { BaseApiService } from '../core/base-api.service';
import { ApiUrl } from '../enums/api-url';
import { LoginEntity, LoginResponse } from '../interfaces/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseApiService {
  constructor(
    protected readonly http: HttpClient,
    protected readonly message: NzMessageService,
    protected readonly router: Router,
    @Inject(PLATFORM_ID) protected readonly platform: Object,
    @Optional() @Inject(RESPONSE) protected readonly response: Response,
    private readonly cookieService: CookieService,
    @Optional() @Inject(REQUEST) private readonly request: Request
  ) {
    super();
  }

  login(loginData: LoginEntity): Observable<LoginResponse> {
    return this.httpPost(this.getApiUrl(ApiUrl.LOGIN), loginData).pipe(
      map((res) => res?.data || {}),
      tap((res) => this.setSession(res, loginData))
    );
  }

  getToken(): string {
    if (isPlatformBrowser(this.platform)) {
      return localStorage.getItem('token') || '';
    }
    return (this.request as any).session?.auth?.token || '';
  }

  getExpiration() {
    if (isPlatformBrowser(this.platform)) {
      try {
        return JSON.parse(<string> localStorage.getItem('token_expires')) || 0;
      } catch (e) {
        return 0;
      }
    }
    return (this.request as any).session?.auth?.expiresAt || 0;
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
