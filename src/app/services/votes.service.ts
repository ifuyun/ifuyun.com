import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { ApiUrl } from '../enums/api-url';
import { VoteType } from '../enums/common.enum';

@Injectable({
  providedIn: 'root'
})
export class VotesService {
  constructor(
    private apiService: ApiService
  ) {
  }

  saveVote(voteDto: { objectId: string, type: VoteType }): Observable<{ vote: number }> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.SAVE_VOTES), voteDto).pipe(
      map((res) => res?.data || {})
    );
  }
}
