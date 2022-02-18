import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { BaseApiService } from '../core/base-api.service';
import { ApiUrl } from '../enums/api-url';
import { AuthResponse, LoginEntity, LoginResponse } from '../interfaces/auth.interface';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseApiService {
  constructor(protected http: HttpClient) {
    super();
  }

  login(loginData: LoginEntity): Observable<LoginResponse> {
    return this.httpPost(this.getApiUrl(ApiUrl.LOGIN), loginData);
  }

  // todo: to be private
  setSession(authResult: AuthResponse) {
    const expiresAt = moment().add(authResult.expiresIn, 'second');

    localStorage.setItem('token', authResult.accessToken);
    localStorage.setItem('token_expires', JSON.stringify(expiresAt.valueOf()));
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('token_expires');
  }

  isLoggedIn() {
    return moment().isBefore(this.getExpiration());
  }

  isLoggedOut() {
    return !this.isLoggedIn();
  }

  getExpiration() {
    const expiration = localStorage.getItem('expires_at') || '';
    const expiresAt = JSON.parse(expiration);
    return moment(expiresAt);
  }
}
