import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { APP_ID } from '../config/common.constant';
import { HttpResponseEntity } from '../interfaces/http-response';
import { VoteEntity } from '../interfaces/vote';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class VoteService {
  constructor(private readonly apiService: ApiService) {}

  saveVote(payload: VoteEntity): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(
        ApiUrl.VOTE,
        {
          ...payload,
          appId: APP_ID
        },
        true
      )
      .pipe(map((res) => res || {}));
  }
}
