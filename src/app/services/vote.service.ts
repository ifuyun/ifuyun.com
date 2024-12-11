import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { HttpResponseEntity } from '../interfaces/http-response';
import { VoteEntity } from '../interfaces/vote';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class VoteService {
  constructor(private apiService: ApiService) {}

  saveVote(payload: VoteEntity): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.VOTE, payload, true).pipe(map((res) => res || {}));
  }
}
