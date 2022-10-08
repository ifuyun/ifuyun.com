import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../../config/api-url';
import { STORAGE_KEY_USER } from '../../config/constants';
import { ApiService } from '../../core/api.service';
import { ResultList } from '../../core/common.interface';
import { HttpResponseEntity } from '../../core/http-response.interface';
import { PlatformService } from '../../core/platform.service';
import { Comment, CommentEntity } from './comment.interface';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  constructor(private apiService: ApiService, private platform: PlatformService) {}

  getCommentsByPostId(postId: string): Observable<ResultList<Comment>> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_COMMENTS), {
        postId
      })
      .pipe(map((res) => res?.data || {}));
  }

  saveComment(comment: CommentEntity): Observable<HttpResponseEntity> {
    if (this.platform.isBrowser) {
      localStorage.setItem(
        STORAGE_KEY_USER,
        JSON.stringify({
          name: comment.authorName,
          email: comment.authorEmail
        })
      );
    }
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.SAVE_COMMENT), comment);
  }
}
