import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { RESPONSE } from '@nguniversal/express-engine/tokens';
import { Response } from 'express';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from '../core/base-api.service';
import { ApiUrl } from '../enums/api-url';
import { VoteType } from '../enums/common.enum';

@Injectable({
  providedIn: 'root'
})
export class VotesService extends BaseApiService{
  constructor(
    protected http: HttpClient,
    protected message: NzMessageService,
    protected router: Router,
    @Inject(PLATFORM_ID) protected platform: Object,
    @Optional() @Inject(RESPONSE) protected response: Response
  ) {
    super();
  }

  saveVote(voteDto: { objectId: string, type: VoteType }): Observable<{ vote: number }> {
    return this.httpPost(this.getApiUrl(ApiUrl.SAVE_VOTES), voteDto).pipe(
      map((res) => res.data || {})
    );
  }
}
