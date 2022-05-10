import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { ApiUrl } from '../config/api-url';
import { VoteType, VoteValue } from '../config/common.enum';

@Injectable({
  providedIn: 'root'
})
export class VotesService {
  constructor(
    private apiService: ApiService
  ) {
  }

  saveVote(voteDto: { objectId: string, value: VoteValue, type: VoteType }): Observable<{ vote: number }> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.SAVE_VOTES), voteDto).pipe(
      map((res) => res?.data || {})
    );
  }
}
