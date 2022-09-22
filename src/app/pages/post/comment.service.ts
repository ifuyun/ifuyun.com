import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../../config/api-url';
import { STORAGE_USER_KEY } from '../../config/constants';
import { ApiService } from '../../core/api.service';
import { PlatformService } from '../../core/platform.service';
import { CommentEntity, CommentList } from './comment.interface';
import { HttpResponseEntity } from '../../core/http-response.interface';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  constructor(private apiService: ApiService, private platform: PlatformService) {}

  getCommentsByPostId(postId: string): Observable<CommentList> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_COMMENTS), {
        postId
      })
      .pipe(map((res) => res?.data || {}));
  }

  saveComment(comment: CommentEntity): Observable<HttpResponseEntity> {
    if (this.platform.isBrowser) {
      localStorage.setItem(
        STORAGE_USER_KEY,
        JSON.stringify({
          name: comment.authorName,
          email: comment.authorEmail
        })
      );
    }
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.SAVE_COMMENTS), comment);
  }
}
