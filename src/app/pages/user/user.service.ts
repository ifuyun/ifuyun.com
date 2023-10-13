import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { ApiUrl } from '../../config/api-url';
import { APP_ID, STORAGE_KEY_USER } from '../../config/common.constant';
import { ApiService } from '../../core/api.service';
import { HttpResponseEntity } from '../../core/http-response.interface';
import { Guest, UserModel } from '../../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private loginUser: BehaviorSubject<UserModel> = new BehaviorSubject<UserModel>({
    appId: '',
    userId: '',
    userNiceName: ''
  });
  loginUser$: Observable<UserModel> = this.loginUser.asObservable();

  constructor(private apiService: ApiService) {}

  getLoginUser(): Observable<UserModel> {
    return this.apiService.httpGet(this.apiService.getApiUrl(ApiUrl.USER_INFO)).pipe(
      map((res) => res?.data || {}),
      tap((user) => this.loginUser.next(user))
    );
  }

  getRegisterUser(userId: string): Observable<UserModel> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.USER_REGISTER_INFO), {
        userId,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }

  getCommentUser(): Guest | null {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_USER) || '');
    } catch (e) {
      return null;
    }
  }

  thirdLogin(authCode: string, from: string): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.USER_THIRD_LOGIN), {
      authCode,
      from,
      appId: APP_ID
    });
  }

  gotoLogin(loginURL: string, isReplace = true) {
    if (isReplace) {
      location.replace(loginURL);
    } else {
      location.href = loginURL;
    }
  }
}
