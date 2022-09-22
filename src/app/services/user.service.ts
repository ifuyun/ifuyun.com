import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiUrl } from '../config/api-url';
import { STORAGE_USER_KEY } from '../config/constants';
import { ApiService } from '../core/api.service';
import { HttpResponseEntity } from '../core/http-response.interface';
import { Guest, UserModel } from '../interfaces/user.interface';

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

  getCommentUser(): Guest | null {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_USER_KEY) || '');
    } catch (e) {
      return null;
    }
  }

  getThirdUser(authCode: string, from: string): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.THIRD_LOGIN), { authCode, from });
  }
}
