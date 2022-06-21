import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiUrl } from '../config/api-url';
import { STORAGE_USER_KEY } from '../config/constants';
import { ApiService } from '../core/api.service';
import { HttpResponseEntity } from '../interfaces/http-response';
import { Guest, UserModel } from '../interfaces/users';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private loginUser: BehaviorSubject<UserModel> = new BehaviorSubject<UserModel>({ userId: '', userNiceName: '' });
  loginUser$: Observable<UserModel> = this.loginUser.asObservable();
  isLoggedIn = false;

  constructor(
    private apiService: ApiService
  ) {
  }

  getLoginUser(): Observable<UserModel> {
    if (this.isLoggedIn) {
      return this.loginUser$;
    }
    return this.apiService.httpGet(this.apiService.getApiUrl(ApiUrl.GET_LOGIN_USER)).pipe(
      map((res) => res?.data || {}),
      tap((user) => {
        this.isLoggedIn = !!user.userId;
        this.loginUser.next(user);
      })
    );
  }

  getCommentUser(): Guest | null {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_USER_KEY) || '');
    } catch (e) {
      return null;
    }
  }

  getAlipayUser(authCode: string): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.THIRD_LOGIN), { authCode });
  }
}
