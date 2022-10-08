import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiUrl } from '../../config/api-url';
import { ApiService } from '../../core/api.service';
import { HttpResponseEntity } from '../../core/http-response.interface';
import { VoteEntity } from './vote.interface';

@Injectable({
  providedIn: 'root'
})
export class VoteService {
  constructor(private apiService: ApiService) {}

  saveVote(voteDto: VoteEntity): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.SAVE_VOTE), voteDto);
  }
}
