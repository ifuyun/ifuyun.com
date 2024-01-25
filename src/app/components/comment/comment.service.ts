import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { ApiUrl } from '../../config/api-url';
import { APP_ID, STORAGE_KEY_USER } from '../../config/common.constant';
import { ApiService } from '../../core/api.service';
import { ResultList } from '../../core/common.interface';
import { HttpResponseEntity } from '../../core/http-response.interface';
import { PlatformService } from '../../core/platform.service';
import { CommentObjectType } from './comment.enum';
import { Comment, CommentEntity } from './comment.interface';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private objectId: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public objectId$: Observable<string> = this.objectId.asObservable();

  updateObjectId(objectId: string) {
    this.objectId.next(objectId);
  }

  constructor(
    private apiService: ApiService,
    private platform: PlatformService
  ) {}

  getCommentsByPostId(postId: string): Observable<ResultList<Comment>> {
    return this.apiService
      .httpGet(
        this.apiService.getApiUrl(ApiUrl.COMMENT_LIST),
        {
          objectId: postId,
          objectType: CommentObjectType.POST,
          appId: APP_ID
        },
        false
      )
      .pipe(map((res) => res?.data || {}));
  }

  getCommentsByWallpaperId(wallpaperId: string): Observable<ResultList<Comment>> {
    return this.apiService
      .httpGet(
        this.apiService.getApiUrl(ApiUrl.COMMENT_LIST),
        {
          objectId: wallpaperId,
          objectType: CommentObjectType.WALLPAPER,
          appId: APP_ID
        },
        false
      )
      .pipe(map((res) => res?.data || {}));
  }

  getCommentsByObjectId(objectId: string, objectType: CommentObjectType): Observable<ResultList<Comment>> {
    if (objectType === CommentObjectType.POST) {
      return this.getCommentsByPostId(objectId);
    }
    return this.getCommentsByWallpaperId(objectId);
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

    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.COMMENT), comment, false);
  }
}
