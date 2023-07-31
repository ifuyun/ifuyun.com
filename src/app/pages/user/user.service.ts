import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { ApiUrl } from '../../config/api-url';
import { STORAGE_KEY_USER } from '../../config/common.constant';
import { ApiService } from '../../core/api.service';
import { HttpResponseEntity } from '../../core/http-response.interface';
import { Guest, UserModel } from '../../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private loginUser: BehaviorSubject<UserModel> = new BehaviorSubject<UserModel>({ userId: '', userNiceName: '' });
  loginUser$: Observable<UserModel> = this.loginUser.asObservable();

  constructor(private apiService: ApiService) {}

  getLoginUser(): Observable<UserModel> {
    return this.apiService.httpGet(this.apiService.getApiUrl(ApiUrl.GET_LOGIN_USER)).pipe(
      map((res) => res?.data || {}),
      tap((user) => this.loginUser.next(user))
    );
  }

  getRegisterUser(userId: string): Observable<UserModel> {
    return this.apiService.httpGet(this.apiService.getApiUrl(ApiUrl.GET_REGISTER_USER), {
      userId
    }).pipe(
      map((res) => res?.data || {})
    );
  }

  getCommentUser(): Guest | null {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_USER) || '');
    } catch (e) {
      return null;
    }
  }

  thirdLogin(authCode: string, from: string): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.THIRD_LOGIN), { authCode, from });
  }

  gotoLogin(loginURL: string, isReplace = true) {
    if (isReplace) {
      location.replace(loginURL);
    } else {
      location.href = loginURL;
    }
  }
}
