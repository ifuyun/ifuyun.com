import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { ApiUrl } from '../config/api-url';
import { LoginUserEntity } from '../interfaces/users';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  constructor(
    private apiService: ApiService
  ) {
  }

  getLoginUser(): Observable<LoginUserEntity> {
    return this.apiService.httpGet(this.apiService.getApiUrl(ApiUrl.GET_LOGIN_USER)).pipe(
      map((res) => res?.data || {})
    );
  }
}
