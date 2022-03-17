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
import { PostType } from '../enums/common.enum';
import { CrumbEntity } from '../interfaces/crumb';
import { Post, PostArchiveDate, PostArchiveDateList, PostArchiveDateMap, PostEntity, PostList, PostQueryParam } from '../interfaces/posts';

@Injectable({
  providedIn: 'root'
})
export class PostsService extends BaseApiService {
  constructor(
    protected http: HttpClient,
    protected router: Router,
    protected message: NzMessageService,
    @Inject(PLATFORM_ID) protected platform: Object,
    @Optional() @Inject(RESPONSE) protected response: Response
  ) {
    super();
  }

  getPosts(param: PostQueryParam): Observable<{ postList: PostList, crumbs: CrumbEntity[] }> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_POSTS), param).pipe(
      map((res) => res.data || {})
    );
  }

  getPostById(postId: string, referer?: string): Observable<Post> {
    return this.httpGet(this.getApiUrlWithParam(ApiUrl.GET_POST, postId), {
      from: referer
    }).pipe(
      map((res) => res.data || {})
    );
  }

  getPostBySlug(slug: string): Observable<Post> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_POST_STANDALONE), {
      slug
    }).pipe(
      map((res) => res.data || {})
    );
  }

  getPostsOfPrevAndNext(postId: string): Observable<{ prevPost: PostEntity, nextPost: PostEntity }> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_POSTS_OF_PREV_AND_NEXT), {
      postId
    }).pipe(
      map((res) => res.data || {})
    );
  }

  getPostArchiveDates({ showCount = false, limit = 10 }): Observable<PostArchiveDate[]> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_POST_ARCHIVE_DATES), {
      postType: PostType.POST,
      showCount: showCount ? 1 : 0,
      limit
    }).pipe(
      map((res) => res.data || [])
    );
  }

  transformArchiveDates(archiveDates: PostArchiveDate[]): PostArchiveDateList {
    const dateList: PostArchiveDateMap = {};
    (archiveDates || []).forEach((item) => {
      const year = item.dateText.split('/')[0];
      dateList[year] = dateList[year] || {};
      dateList[year].list = dateList[year].list || [];
      dateList[year].list.push(item);
      dateList[year].countByYear = dateList[year].countByYear || 0;
      dateList[year].countByYear += item.count || 0;
    });
    const yearList = Object.keys(dateList).sort((a, b) => a < b ? 1 : -1);

    return {
      dateList, yearList
    };
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
