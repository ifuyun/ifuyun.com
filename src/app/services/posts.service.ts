import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from '../core/base-api.service';
import { ApiUrl } from '../enums/api-url';
import { PostArchiveDate, PostEntity, PostList, PostQueryParam } from '../interfaces/posts';

@Injectable({
  providedIn: 'root'
})
export class PostsService extends BaseApiService {
  constructor(
    protected http: HttpClient,
    protected message: NzMessageService
  ) {
    super();
  }

  getPosts(param: PostQueryParam): Observable<PostList> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_POSTS), param).pipe(
      map((res) => res.data || {})
    );
  }

  getPostArchiveDates({ showCount = false }): Observable<PostArchiveDate[]> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_POST_ARCHIVE_DATES), {
      showCount: showCount ? 1 : 0
    }).pipe(
      map((res) => res.data || [])
    );
  }

  getHotPosts(): Observable<PostEntity[]> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_POSTS_OF_HOT)).pipe(
      map((res) => res.data || [])
    );
  }

  getRandomPosts(): Observable<PostEntity[]> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_POSTS_OF_RANDOM)).pipe(
      map((res) => res.data || [])
    );
  }
}
