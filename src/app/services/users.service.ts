import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../config/api-url';
import { STORAGE_USER_KEY } from '../config/constants';
import { ApiService } from '../core/api.service';
import { Guest, UserModel } from '../interfaces/users';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  constructor(
    private apiService: ApiService
  ) {
  }

  getLoginUser(): Observable<UserModel> {
    return this.apiService.httpGet(this.apiService.getApiUrl(ApiUrl.GET_LOGIN_USER)).pipe(
      map((res) => res?.data || {})
    );
  }

  getCommentUser(): Guest | null {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_USER_KEY) || '');
    } catch (e) {
      return null;
    }
  }
}
