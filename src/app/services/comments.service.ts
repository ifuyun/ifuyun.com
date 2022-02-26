import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from '../core/base-api.service';
import { ApiUrl } from '../enums/api-url';
import { CommentEntity } from '../interfaces/comments';

@Injectable({
  providedIn: 'root'
})
export class CommentsService extends BaseApiService{
  constructor(
    protected http: HttpClient,
    protected message: NzMessageService
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
}
