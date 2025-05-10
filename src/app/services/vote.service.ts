import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from 'src/app/config/api-url';
import { APP_ID } from 'src/app/config/common.constant';
import { HttpResponseEntity } from 'src/app/interfaces/http-response';
import { VoteEntity } from 'src/app/interfaces/vote';
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
