import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService, HttpResponseEntity } from 'common/core';
import { VoteEntity } from 'common/interfaces';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VoteService {
  constructor(
    private readonly apiService: ApiService,
    private readonly appConfigService: AppConfigService
  ) {}

  saveVote(payload: VoteEntity): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(
        ApiUrl.VOTE,
        {
          ...payload,
          appId: this.appConfigService.appId
        },
        true
      )
      .pipe(map((res) => res || {}));
  }
}
