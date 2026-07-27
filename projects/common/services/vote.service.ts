import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, HttpResponseEntity } from 'common/core';
import { VoteDto } from 'common/interfaces';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VoteService {
  constructor(private readonly apiService: ApiService) {}

  saveVote(payload: VoteDto): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.VOTE, payload, true).pipe(map((res) => res || {}));
  }
}
