import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { ApiUrl } from '../config/api-url';
import { CommentEntity, CommentModel } from '../interfaces/comments';
import { HttpResponseEntity } from '../interfaces/http-response';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  constructor(
    private apiService: ApiService
  ) {
  }

  getCommentsByPostId(postId: string): Observable<CommentModel[]> {
    return this.apiService.httpGet(this.apiService.getApiUrl(ApiUrl.GET_COMMENTS), {
      postId
    }).pipe(
      map((res) => res?.data || {})
    );
  }

  saveComment(comment: CommentEntity): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.SAVE_COMMENTS), comment);
  }
}
