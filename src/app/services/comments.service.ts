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
import { CommentDto, CommentEntity } from '../interfaces/comments';
import { HttpResponseEntity } from '../interfaces/http-response';

@Injectable({
  providedIn: 'root'
})
export class CommentsService extends BaseApiService {
  constructor(
    protected http: HttpClient,
    protected router: Router,
    protected message: NzMessageService,
    @Inject(PLATFORM_ID) protected platform: Object,
    @Optional() @Inject(RESPONSE) protected response: Response
  ) {
    super();
  }

  getCommentsByPostId(postId: string): Observable<CommentEntity[]> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_COMMENTS), {
      postId
    }).pipe(
      map((res) => res.data || {})
    );
  }

  saveComment(commentDto: CommentDto): Observable<HttpResponseEntity> {
    return this.httpPost(this.getApiUrl(ApiUrl.SAVE_COMMENTS), commentDto);
  }
}
