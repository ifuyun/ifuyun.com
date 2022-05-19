import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { ApiService } from '../core/api.service';
import { HttpResponseEntity } from '../interfaces/http-response';
import { VoteEntity } from '../interfaces/votes';

@Injectable({
  providedIn: 'root'
})
export class VotesService {
  constructor(
    private apiService: ApiService
  ) {
  }

  saveVote(voteDto: VoteEntity): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.SAVE_VOTES), voteDto);
  }
}
